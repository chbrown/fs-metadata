var async = require('async');
var path_1 = require('path');
// Use lstat instead of stat (since stat automatically resolves symlinks)
var fs_1 = require('fs');
var crypto_1 = require('crypto');
function assign(target, source) {
    Object.keys(source).forEach(function (key) {
        target[key] = source[key];
    });
    return target;
}
/**
Read the given stream to end and return its SHA-1 hash as a string in hex digest form.
*/
function hashStream(stream, callback) {
    // The 'algorithm' argument to createHash can be any one of the strings
    // returned from crypto.getHashes(). I'm going with 'sha1' since it's
    // 2^80 (≈1e24) collision-resistent, and easy to recreate; the 'sha1'
    // algorithm is equivalent to the command line's `shasum` default.
    // using <any>, since node.d.ts only has old non-streaming createHash type declarations
    var hash = crypto_1.createHash('sha1');
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
exports.nullChecksum = '0000000000000000000000000000000000000000';
function hashString(input) {
    var hash = crypto_1.createHash('sha1');
    hash.update(input);
    var digest = hash.digest('hex');
    return digest;
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
Recursively read a FSNode tree, returning an object that represents the file at the given path.
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
                // not sure what order readdir produces by default, but lexicographic
                // ordering seems a reasonable schelling point.
                files.sort();
                // TypeScript can infer the async.map output type if I use just read,
                // but not if I use an anonymous function. Weird.
                async.map(files, function (file, callback) { return read(path_1.join(path, file), callback); }, function (error, nodes) {
                    if (error)
                        return callback(error);
                    // the directory checksum is somewhat arbitrary, but relatively simple
                    var checksum = hashString(nodes.map(function (node) { return node.name + node.checksum; }).join('\n'));
                    callback(null, assign(node, { checksum: checksum, children: nodes }));
                });
            });
        }
        else if (node.type == 'file') {
            // files require a checksum
            hashStream(fs_1.createReadStream(path), function (error, checksum) {
                if (error)
                    return callback(error);
                callback(null, assign(node, { checksum: checksum }));
            });
        }
        else if (node.type == 'symlink') {
            fs_1.readlink(path, function (error, linkString) {
                if (error)
                    return callback(error);
                // it's a silly checksum, but it keeps things uniform
                var checksum = hashString(linkString);
                callback(null, assign(node, { checksum: checksum, target: linkString }));
            });
        }
        else {
            callback(null, assign(node, { checksum: exports.nullChecksum }));
        }
    });
}
exports.read = read;
