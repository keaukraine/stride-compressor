#!/usr/bin/env node

const { Float16Array } = require("@petamoriken/float16");
const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

/**
 * Usage:
 * node src/texture-generator.js texture.txt --precision=[16|32]
 */

const argv = yargs.argv;
const precision = argv.precision; // 16 or 32

fs.readFile(argv._[0], "utf8", (err, data) => {
    const splitData = data.split(/\s+/);

    const values = [];
    for (value of splitData) {
        const n = parseFloat(value);
        if (!isNaN(n)) {
            values.push(n);
        }
    }

    const result = new ArrayBuffer(values.length * (precision === 16 ? 2 : 4));
    const view = precision === 16
        ? new Float16Array(result, 0, values.length)
        : new Float32Array(result, 0, values.length);
    for (let i = 0; i < values.length; i++) {
        view[i] = values[i];
    }

    const parsedPath = path.parse(argv._[0]);
    const outputFile = path.join(parsedPath.dir, `${parsedPath.name}.rgb.fp${precision}`);
    fs.writeFileSync(outputFile, new Buffer.from(result));

    console.log(`Parsed ${values.length} floats, written ${result.byteLength} bytes.`);
});
