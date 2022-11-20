#!/usr/bin/env node

const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

/**
 * Usage:
 * node src/uint2ubyte.js name
 */

const argv = yargs.argv;

const name = argv._[0];

const stat = fs.statSync(name);
const size = stat.size;
const resultArray = [];
let maxIndex = 0;

const data = fs.readFileSync(name);
for (let i = 0; i < size; i++) {
    if (i % 2 === 0) {
        maxIndex = Math.max(maxIndex, data[i]);
        resultArray.push(data[i]);
    } else {
        if (data[i] !== 0) {
            console.log("Found value not fitting into ubyte, aborting");
            process.exit(1);
        }
    }
}

console.log(`Indices: ${size / 2}; max index = ${maxIndex}`);

const outputFile = path.join(path.dirname(name), "output", path.basename(name));
fs.writeFileSync(outputFile, new Buffer.from(resultArray));
