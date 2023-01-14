#!/usr/bin/env node

const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

/**
 * Usage:
 */

const argv = yargs.argv;

const contents = fs.readFileSync(argv._[0], "utf8");

const lines = contents.split("\n");

// const regexVertexLine = /v\s+([+-]?([0-9]*[.])?[0-9]+)\s+([+-]?([0-9]*[.])?[0-9]+)\s+([+-]?([0-9]*[.])?[0-9]+)/gi;

const min = [0, 0, 0];
const max = [0, 0, 0];

for (const line of lines) {
    const matches = /v\s+([+-]?([0-9]*[.])?[0-9]+)\s+([+-]?([0-9]*[.])?[0-9]+)\s+([+-]?([0-9]*[.])?[0-9]+)/gi.exec(line);
    if (!matches) {
        continue;
    }
    const [, x, , y, , z] = matches.map(parseFloat);
    if (x !== undefined && y !== undefined && z !== undefined) {
        // console.log(x, y, z);
        min[0] = Math.min(min[0], x);
        min[1] = Math.min(min[1], y);
        min[2] = Math.min(min[2], z);
        max[0] = Math.max(max[0], x);
        max[1] = Math.max(max[1], y);
        max[2] = Math.max(max[2], z);
    }
}

console.log("Model min vertex coordinates: ", min);
console.log("Model max vertex coordinates: ", max);

const maxCoord = Math.max(...min.map(Math.abs), ...max);
const multiplier = 127 / maxCoord;

console.log("Scale to fit in (-127, 127) range: ", multiplier);