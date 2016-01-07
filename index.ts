import * as async from 'async';
import {join, dirname, basename} from 'path';
// Use lstat instead of stat (since stat automatically resolves symlinks)
import {readdir, readlink, lstat, Stats, createReadStream} from 'fs';
import {createHash} from 'crypto';

/**
@param {string} algorithm - One of the strings returned from crypto.getHashes()
*/
function checksum(algorithm: string,
                  stream: NodeJS.ReadableStream,
                  callback: (error: Error, digest?: string) => void) {
  // node.d.ts only has old createHash type declarations
  let hash = <any>createHash(algorithm);
  // we have to call setEncoding here, not in the on('end', ...) callback (bug?)
  hash.setEncoding('hex');
  stream.pipe(hash);
  stream.on('error', (error) => {
    callback(error);
  });
  stream.on('end', () => {
    let digest = hash.read();
    callback(null, digest);
  });
}

/**
Resolve an fs.Stats instance to its file type.

It returns undefined if none of the isX() methods on fs.Stats return true.
It's unclear if this would ever happen.

@returns {string} One of "file", "directory", "device", "symlink", "fifo", or "socket"
*/
function statsType(stats: Stats): string {
  if (stats.isFile()) return 'file';
  if (stats.isDirectory()) return 'directory';
  if (stats.isBlockDevice()) return 'device';
  if (stats.isCharacterDevice()) return 'device';
  if (stats.isSymbolicLink()) return 'symlink';
  if (stats.isFIFO()) return 'fifo';
  if (stats.isSocket()) return 'socket';
}

/**
N.b.: Directories have size.
*/
export interface FSNode {
  /** local filename of this node, does not contain any parental information */
  name: string;

  /** type of file, one of "file", "directory", "device", "symlink", "fifo", or "socket" (fs.Stats.is*()) */
  type: string;
  /** The total size of file in bytes (fs.Stats.size) */
  size: number;
  /** Epoch time when file data last accessed (fs.Stats.atime.getTime() / 1000) */
  atime: number;
  /** Epoch time when file data last modified (fs.Stats.mtime.getTime() / 1000) */
  mtime: number;
  /** Epoch time when file status was last changed (inode data modification) (fs.Stats.ctime.getTime() / 1000) */
  ctime: number;
  /** Epoch time of file creation. Set once when the file is created (fs.Stats.birthtime.getTime() / 1000) */
  btime: number;

  /** If type == 'file', represents the SHA-1 checksum of the file, as a hex digest */
  checksum?: string;
  /** If type == 'directory', represents the children of this node (files inside this directory) */
  children?: FSNode[];
  /** If type == 'symlink', represents the target of the link */
  target?: string;
}

/**

*/
export function read(path: string, callback: (error: Error, node?: FSNode) => void): void {
  lstat(path, (error, stats) => {
    if (error) return callback(error);

    let node: FSNode = {
      name: basename(path),
      type: statsType(stats),
      size: stats.size,
      atime: stats.atime.getTime() / 1000,
      mtime: stats.mtime.getTime() / 1000,
      ctime: stats.ctime.getTime() / 1000,
      btime: stats.birthtime.getTime() / 1000,
    };

    if (node.type == 'directory') {
      // directories require recursion
      readdir(path, (error, files) => {
        if (error) return callback(error);

        // is this the default from readdir?
        // files.sort();

        let paths = files.map(file => join(path, file));
        async.map(paths, read, (error, nodes) => {
          if (error) return callback(error);

          node.children = nodes;
          callback(null, node);
        });
      });
    }
    else if (node.type == 'file') {
      // files require a checksum
      // the 'sha1' algorithm is equivalent to the `shasum` command line default
      // sha1 is 2^80 collision-resistent, which is on the order of 1e24
      checksum('sha1', createReadStream(path), (error, digest) => {
        if (error) return callback(error);

        node.checksum = digest;
        callback(null, node);
      });
    }
    else if (node.type == 'symlink') {
      readlink(path, (error, linkString) => {
        if (error) return callback(error);

        node.target = linkString;
        callback(null, node);
      });
    }
    else {
      callback(null, node);
    }
  });
}
