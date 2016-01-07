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
export declare function read(path: string, callback: (error: Error, node?: FSNode) => void): void;
