#!/usr/bin/env node

const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

/**
 * Usage:
 * node reduce-obj-precision.js input.obj output.obj --precision=3 --scale=0.5
 * Reduces vertex precision of OBJ files
 */

const argv = yargs.argv;

const inputFileName = argv._[0];
const outputFileName = argv._[1];
const precision = +argv.precision;
const scale = +argv.scale;

const contents = fs.readFileSync(inputFileName, "utf8");
const lines = contents.split("\n");

let result = "";

for (let line of lines) {
    const [type, ...value] = line.split(/\s+/);
    const [x, y, z] = value.map(v => ((+v) * scale).toFixed(precision));

    if (type === "v") {
        line = `v ${x} ${y} ${z}`;
    }

    result += line;
    result += "\n";
}

fs.writeFileSync(outputFileName, result);
