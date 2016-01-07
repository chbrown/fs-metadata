export declare const nullChecksum: string;
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
    /** A SHA-1 hash represented as a hex digest.
    If type == 'file', it's computed from the file's bytes.
    If type == 'directory', it's computed from the names and checksums of its children (see the readme).
    If type == 'symlink', it's computed from its target path.
    Otherwise, it's '0000000000000000000000000000000000000000'. */
    checksum: string;
    /** If type == 'directory', represents the children of this node (files inside this directory) */
    children?: FSNode[];
    /** If type == 'symlink', represents the target of the link */
    target?: string;
}
/**
Recursively read a FSNode tree, returning an object that represents the file at the given path.
*/
export declare function read(path: string, callback: (error: Error, node?: FSNode) => void): void;
