#!/usr/bin/env node

const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

/**
 * Usage:
 * node src/bin2text.js model.bin --stride=<number> [--precision=<number>]
 * Outputs text file to "text" subdirectory (it must exist).
 */

const argv = yargs.argv;
const strideSize = argv.stride;
const precision = argv.precision;

fs.readFile(argv._[0], (err, data) => {
    const input = new Float32Array(data.buffer, 0, data.byteLength / 4);
    let result = "";

    for (let i = 0; i < input.length; i++) {
        if (i > 0 && i % strideSize === 0) {
            result += "\n";
        }
        result += precision !== undefined ? input[i].toFixed(precision) : input[i];
        result += "\t";
    }

    const parsedPath = path.parse(argv._[0]);
    const outputFile = path.join(parsedPath.dir, "text", `${parsedPath.name}.txt`);
    fs.writeFileSync(outputFile, result);

    console.log(`Parsed ${input.length} floats.`);
});
