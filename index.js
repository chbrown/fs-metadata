var async = require('async');
var path_1 = require('path');
// Use lstat instead of stat (since stat automatically resolves symlinks)
var fs_1 = require('fs');
var crypto_1 = require('crypto');
/**
@param {string} algorithm - One of the strings returned from crypto.getHashes()
*/
function checksum(algorithm, stream, callback) {
    // node.d.ts only has old createHash type declarations
    var hash = crypto_1.createHash(algorithm);
    // we have to call setEncoding here, not in the on('end', ...) callback (bug?)
    hash.setEncoding('hex');
    stream.pipe(hash);
    stream.on('error', function (error) {
        callback(error);
    });
    stream.on('end', function () {
        var digest = hash.read();
        callback(null, digest);
    });
}
/**
Resolve an fs.Stats instance to its file type.

It returns undefined if none of the isX() methods on fs.Stats return true.
It's unclear if this would ever happen.

@returns {string} One of "file", "directory", "device", "symlink", "fifo", or "socket"
*/
function statsType(stats) {
    if (stats.isFile())
        return 'file';
    if (stats.isDirectory())
        return 'directory';
    if (stats.isBlockDevice())
        return 'device';
    if (stats.isCharacterDevice())
        return 'device';
    if (stats.isSymbolicLink())
        return 'symlink';
    if (stats.isFIFO())
        return 'fifo';
    if (stats.isSocket())
        return 'socket';
}
/**

*/
function read(path, callback) {
    fs_1.lstat(path, function (error, stats) {
        if (error)
            return callback(error);
        var node = {
            name: path_1.basename(path),
            type: statsType(stats),
            size: stats.size,
            atime: stats.atime.getTime() / 1000,
            mtime: stats.mtime.getTime() / 1000,
            ctime: stats.ctime.getTime() / 1000,
            btime: stats.birthtime.getTime() / 1000,
        };
        if (node.type == 'directory') {
            // directories require recursion
            fs_1.readdir(path, function (error, files) {
                if (error)
                    return callback(error);
                // is this the default from readdir?
                // files.sort();
                var paths = files.map(function (file) { return path_1.join(path, file); });
                async.map(paths, read, function (error, nodes) {
                    if (error)
                        return callback(error);
                    node.children = nodes;
                    callback(null, node);
                });
            });
        }
        else if (node.type == 'file') {
            // files require a checksum
            // the 'sha1' algorithm is equivalent to the `shasum` command line default
            // sha1 is 2^80 collision-resistent, which is on the order of 1e24
            checksum('sha1', fs_1.createReadStream(path), function (error, digest) {
                if (error)
                    return callback(error);
                node.checksum = digest;
                callback(null, node);
            });
        }
        else if (node.type == 'symlink') {
            fs_1.readlink(path, function (error, linkString) {
                if (error)
                    return callback(error);
                node.target = linkString;
                callback(null, node);
            });
        }
        else {
            callback(null, node);
        }
    });
}
exports.read = read;
