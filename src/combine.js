#!/usr/bin/env node

const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

/**
 * Usage:
 * node src/combine.js name --frames=10 width=1024
 */

const argv = yargs.argv;

const name = argv._[0];
const frames = argv.frames;
const width = argv.width;

const stat = fs.statSync(`${name}1-strides.bin`);
const vertices = stat.size / 6;
const chunks = Math.ceil(vertices / width);
const textureHeight = chunks * (frames + 1);

console.log(`Vertices: ${vertices}; split into ${chunks} chunks.`);
console.log(`Texture dimensions: ${width}x${textureHeight}.`);

const result = new ArrayBuffer(width * 6 * (frames + 1) * chunks);

const resultArray = [];

for (let chunk = 0; chunk < chunks; chunk++) {
    const bytesToRead = width * 6;
    const startReadOffset = chunk * width * 6;
    // console.log(startReadOffset, bytesToRead);

    // read each frame
    for (let frame = 0; frame < frames; frame++) {
        const data = fs.readFileSync(`${name}${frame + 1}-strides.bin`);
        // write 1 texture line
        for (let x = startReadOffset; x < startReadOffset + bytesToRead; x++) {
            const readByte = x < data.byteLength
                ? data[x]
                : 0;
            resultArray.push(readByte);
        }
    }

    // 1px padding between chunks
    for (let i = 0; i < width * 6; i++) {
        resultArray.push(0);
    }
}

const parsedPath = path.parse(name);
const outputFile = path.join(parsedPath.dir, parsedPath.name + ".rgb.fp16");
fs.writeFileSync(outputFile, Buffer.from(resultArray));
