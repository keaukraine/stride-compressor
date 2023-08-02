#!/usr/bin/env node

const yargs = require("yargs");
const fs = require("fs");

/**
 * Usage: obj-bbox.js model.obj
 */

const argv = yargs.argv;

const filename = argv._[0];
const contents = fs.readFileSync(filename, "utf8");

const lines = contents.split("\n");

const min = [0, 0, 0];
const max = [0, 0, 0];

for (const line of lines) {
    const matches = /v\s+([+-]?([0-9]*[.])?[0-9]+)\s+([+-]?([0-9]*[.])?[0-9]+)\s+([+-]?([0-9]*[.])?[0-9]+)/gi.exec(line);
    if (!matches) {
        continue;
    }
    const [, x, , y, , z] = matches.map(parseFloat);
    if (x !== undefined && y !== undefined && z !== undefined) {
        min[0] = Math.min(min[0], x);
        min[1] = Math.min(min[1], y);
        min[2] = Math.min(min[2], z);
        max[0] = Math.max(max[0], x);
        max[1] = Math.max(max[1], y);
        max[2] = Math.max(max[2], z);
    }
}

console.log("AABB for", filename);
console.log("Model min vertex coordinates: ", min);
console.log("Model max vertex coordinates: ", max);

const maxCoord = Math.max(...min.map(Math.abs), ...max.map(Math.abs));
const multiplier127 = 127 / maxCoord;
const multiplier511 = 511 / maxCoord;

console.log("Scale to fit in (-127, 127) range: ", multiplier127);
console.log("Scale to fit in (-511, 511) range: ", multiplier511);
console.log("");
