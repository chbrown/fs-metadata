import * as async from 'async';
import {join, dirname, basename} from 'path';
import {readdir, readlink, lstat, Stats, createReadStream} from 'fs';
import {createHash} from 'crypto';

function assign<T, U>(target: T, source: U): T & U {
  Object.keys(source).forEach(key => {
    target[key] = source[key];
  });
  return <any>target;
}

/**
Read the given stream to end and return its SHA-1 hash as a string in hex digest form.
*/
export function hashStream(stream: NodeJS.ReadableStream,
                           callback: (error: Error, checksum?: string) => void) {
  // The 'algorithm' argument to createHash can be any one of the strings
  // returned from crypto.getHashes(). I'm going with 'sha1' since it's
  // 2^80 (≈1e24) collision-resistent, and easy to recreate; the 'sha1'
  // algorithm is equivalent to the command line's `shasum` default.
  // using <any>, since node.d.ts only has old non-streaming createHash type declarations
  const hash = <any>createHash('sha1');
  // we have to call setEncoding here, not in the on('end', ...) callback (bug?)
  hash.setEncoding('hex');
  stream.pipe(hash);
  stream.on('error', (error) => {
    callback(error);
  });
  stream.on('end', () => {
    const digest = hash.read();
    callback(null, digest);
  });
}

export const nullChecksum = '0000000000000000000000000000000000000000';

/**
Read the given string and return its SHA-1 hash as a string in hex digest form.
*/
export function hashString(input: string): string {
  const hash = createHash('sha1');
  hash.update(input);
  const digest = hash.digest('hex');
  return digest;
}

export type FSNodeType = 'file' | 'directory' | 'device' | 'symlink' | 'fifo' | 'socket';

/**
Resolve an fs.Stats instance to its file type.

It returns undefined if none of the isX() methods on fs.Stats return true.
It's unclear if this would ever happen.

@returns {string} One of "file", "directory", "device", "symlink", "fifo", or "socket"
*/
function statsType(stats: Stats): FSNodeType {
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
export interface FSNodeStructure {
  /** local filename of this node, does not contain any parental information */
  name: string;

  /** type of file, one of "file", "directory", "device", "symlink", "fifo", or "socket" (fs.Stats.is*()) */
  type: FSNodeType;
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

  /** If type == 'directory', represents the children of this node (files inside this directory) */
  children?: this[];
  /** If type == 'symlink', represents the target of the link */
  target?: string;
}

export interface FSNode extends FSNodeStructure {
  /** A SHA-1 hash represented as a hex digest.
  If type == 'file', it's computed from the file's bytes.
  If type == 'directory', it's computed from the names and checksums of its children (see the readme).
  If type == 'symlink', it's computed from its target path.
  Otherwise, it's '0000000000000000000000000000000000000000'. */
  checksum: string;
}

/**
Recursively read a FSNode tree, returning an object that represents the file at the given path.
*/
export function readChecksums(node: FSNodeStructure, parentPath: string, callback: (error: Error, node?: FSNode) => void): void {
  const path = join(parentPath, node.name);
  if (node.type == 'directory') {
    async.map<FSNodeStructure, FSNode>(node.children, (childNode, callback) => {
      readChecksums(childNode, path, callback);
    }, (error, nodes) => {
      if (error) return callback(error);
      // the directory checksum is somewhat arbitrary, but relatively simple
      const checksum = hashString(nodes.map(node => node.name + node.checksum).join('\n'));
      callback(null, assign(node, {checksum, children: nodes}));
    });
  }
  else if (node.type == 'file') {
    // files require a checksum
    hashStream(createReadStream(path), (error, checksum) => {
      if (error) return callback(error);

      callback(null, assign(node, {checksum, children: undefined}));
    });
  }
  else if (node.type == 'symlink') {
    // it's a silly checksum, but it keeps things uniform
    const checksum = hashString(node.target);
    callback(null, assign(node, {checksum, children: undefined}));
  }
  else {
    callback(null, assign(node, {checksum: nullChecksum, children: undefined}));
  }
}

/**
Recursively read a FSNode tree, without checksums, returning as the root node
a representation of the file at the given path.
*/
export function readStructure(path: string, callback: (error: Error, node?: FSNodeStructure) => void): void {
  // Use lstat instead of stat (since stat automatically resolves symlinks)
  lstat(path, (error, stats) => {
    if (error) return callback(error);

    const node = {
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

        // not sure what order readdir produces by default, but lexicographic
        // ordering seems a reasonable schelling point.
        files.sort();

        // TypeScript can infer the async.map output type if I use just read,
        // but not if I use an anonymous function. Weird.
        async.map<string, FSNode>(files, (file, callback) => readStructure(join(path, file), callback), (error, nodes) => {
          if (error) return callback(error);
          callback(null, assign(node, {children: nodes}));
        });
      });
    }
    else if (node.type == 'file') {
      callback(null, node);
    }
    else if (node.type == 'symlink') {
      readlink(path, (error, linkString) => {
        if (error) return callback(error);
        callback(null, assign(node, {target: linkString}));
      });
    }
    else {
      callback(null, node);
    }
  });
}

export function read(path: string, callback: (error: Error, node?: FSNode) => void): void {
  readStructure(path, (error, node) => {
    if (error) return callback(error);
    readChecksums(node, dirname(path), callback);
  });
}
