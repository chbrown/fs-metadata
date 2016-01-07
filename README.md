# fs-metadata

A filesystem representation, without the actual data.

The output of running `fs-metadata .` (after deleting the contents of `node_modules/`) looks like this:

    {
      "name": ".",
      "type": "directory",
      "size": 476,
      "atime": 1452180519,
      "mtime": 1452180460,
      "ctime": 1452180460,
      "btime": 1452169219,
      "children": [
        {
          "name": "Makefile",
          "type": "file",
          "size": 197,
          "atime": 1452180519,
          "mtime": 1452169744,
          "ctime": 1452169744,
          "btime": 1452169709,
          "checksum": "91de0f6a8ae7606e2982efcfd2ec8dbd14abf4a7"
        },
        {
          "name": "README.md",
          "type": "file",
          "size": 125,
          "atime": 1452180519,
          "mtime": 1452180476,
          "ctime": 1452180476,
          "btime": 1439493444,
          "checksum": "bf1167ac8a71dc3a5f32443d711e997c0057ecf6"
        },
        {
          "name": "bin",
          "type": "directory",
          "size": 102,
          "atime": 1452180519,
          "mtime": 1452172424,
          "ctime": 1452172424,
          "btime": 1452172422,
          "children": [
            {
              "name": "fs-metadata",
              "type": "file",
              "size": 852,
              "atime": 1452180527,
              "mtime": 1452180391,
              "ctime": 1452180391,
              "btime": 1452172424,
              "checksum": "622be33e359b6e1ec4d213d6e3eeabc6adafc49b"
            }
          ]
        },
        {
          "name": "index.d.ts",
          "type": "file",
          "size": 1278,
          "atime": 1452180519,
          "mtime": 1452178736,
          "ctime": 1452178736,
          "btime": 1452169748,
          "checksum": "01edfb02bfacb1933c1d82ec3ce6afb8a8185740"
        },
        {
          "name": "index.js",
          "type": "file",
          "size": 3447,
          "atime": 1452180527,
          "mtime": 1452178736,
          "ctime": 1452178736,
          "btime": 1452169748,
          "checksum": "64acb0de678e599c29cd250c03b905f3bbc5b706"
        },
        {
          "name": "index.ts",
          "type": "file",
          "size": 4246,
          "atime": 1452180519,
          "mtime": 1452180254,
          "ctime": 1452180254,
          "btime": 1439563317,
          "checksum": "d616637460a7fbc4a1b9ea7880e53f2a453a56bd"
        },
        {
          "name": "node_modules",
          "type": "directory",
          "size": 340,
          "atime": 1452180519,
          "mtime": 1452175950,
          "ctime": 1452175950,
          "btime": 1452169510,
          "children": []
        },
        {
          "name": "package.json",
          "type": "file",
          "size": 621,
          "atime": 1452180519,
          "mtime": 1452171780,
          "ctime": 1452171780,
          "btime": 1432683185,
          "checksum": "513e768c831efac5d712baffa360312bc1b8fc74"
        },
        {
          "name": "tsconfig.json",
          "type": "file",
          "size": 208,
          "atime": 1452180519,
          "mtime": 1452172733,
          "ctime": 1452172733,
          "btime": 1448346772,
          "checksum": "56e09cc1671fd3c8a0271101fa1735e6c8fd80bb"
        }
      ]
    }


## License

Copyright 2015 Christopher Brown. [MIT Licensed](http://chbrown.github.io/licenses/MIT/#2015).
