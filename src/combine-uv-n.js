#!/usr/bin/env node

const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

/**
 * Usage: combine-uv-n source.txt
 */

const argv = yargs.argv;

const fileName = argv._[0];

const contents = fs.readFileSync(fileName, "utf8");
let result = "";

const lines = contents.split("\n");

for (const line of lines) {
    const values = line.split("\t");
    const [vx, vy, vz, u, v, ni] = values;
    const combined = (u << 3) | ni;
    result += `${vx}\t${vy}\t${vz}\t${combined}\n`;
}

const outputFile = path.join(path.dirname(fileName), "combined", path.basename(fileName));
fs.writeFileSync(outputFile, result);
