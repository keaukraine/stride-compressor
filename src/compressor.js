#!/usr/bin/env node

const { Float16Array } = require("@petamoriken/float16");
const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

/**
 * Usage:
 * node src/compressor.js buddha-strides.bin --stride=FFF-hh-hh-hhh
 */


/** Returns a string representation of 32-bit number. */
function dec2bin(dec) {
    let str = (dec >>> 0).toString(2);
    for (; str.length < 32;) {
        str = "0" + str;
    }
    return str;
}

/**
 * Packs 3 floats to INT_2_10_10_10_REV structure. Normalizes values.
 */
function pack3FloatsNormalized(x, y, z) {
    const px = (Math.floor(x * 511)) & 0x000003FF;
    const py = (Math.floor(y * 511)) << 10 & 0x000FFC00;
    const pz = (Math.floor(z * 511)) << 20 & 0x3FF00000;
    return px | py | pz;
}

/**
 * Packs 3 floats to INT_2_10_10_10_REV structure. Writes 1 to w component.
 */
function pack3Floats(x, y, z) {
    const px = (Math.floor(x)) & 0x000003FF;
    const py = (Math.floor(y)) << 10 & 0x000FFC00;
    const pz = (Math.floor(z)) << 20 & 0x3FF00000;
    const pw = 1 << 30;
    return px | py | pz | pw;
}

const argv = yargs.argv;
const align = argv.alignment === undefined ? true : argv.alignment;
const strideFormat = argv.stride;
let strideSize = 0; // Stride size in floats (items count)
let outStrideSize = 0; // Output stride size in bytes
const types = [];
let scale = parseFloat(argv.scale);
if (isNaN(scale)) {
    scale = 1.0;
}

let i = 0;
for (const type of strideFormat) {
    switch (type) {
        case "0": // one byte padding
            outStrideSize += 1;
            types[i++] = "padding";
            break;
        case "x": // skip one value
        case "X":
            strideSize += 1;
            types[i++] = "skip";
            break;
        case "p":
            strideSize += 3;
            outStrideSize += 4;
            types[i++] = "packed3-normalized";
            break;
        case "P":
            strideSize += 3;
            outStrideSize += 4;
            types[i++] = "packed3";
            break;
        case "F":
        case "f":
            strideSize += 1;
            outStrideSize += 4;
            types[i++] = "float";
            break;
        case "H":
        case "h":
            strideSize += 1;
            outStrideSize += 2;
            types[i++] = "half";
            break;
        case "b":
            strideSize += 1;
            outStrideSize += 1;
            types[i++] = "sbyte-norm";
            break;
        case "B":
            strideSize += 1;
            outStrideSize += 1;
            types[i++] = "sbyte";
            break;
        case "U":
            strideSize += 1;
            outStrideSize += 1;
            types[i++] = "ubyte";
            break;
        case "u":
            strideSize += 1;
            outStrideSize += 1;
            types[i++] = "ubyte-norm";
            break;
    }
}

const padding = align
    ? (Math.ceil(outStrideSize / 4) * 4) - outStrideSize
    : 0;

console.log(`Original stride size ${strideSize * 4} bytes; new stride size ${outStrideSize + padding} bytes (last ${padding} bytes are empty).`);

fs.readFile(argv._[0], (err, data) => {
    const input = new Float32Array(data.buffer, 0, data.byteLength / 4);
    const result = new ArrayBuffer(data.byteLength / strideSize / 4 * (outStrideSize + padding));

    for (let i = 0; i < input.length / strideSize; i++) {
        const outStrideStart = i * (outStrideSize + padding);
        let outStrideOffset = 0;
        let j = 0;
        for (const type of types) {
            let floatValue = input[i * strideSize + j];
            if (type === "padding") {
                outStrideOffset += 1;
            } else if (type === "skip") {
                j++;
            } else if (type === "float") {
                const view = new Float32Array(result, outStrideStart + outStrideOffset, 1);
                view[0] = floatValue;
                outStrideOffset += 4;
                j++;
            } else if (type === "half") {
                const view = new Float16Array(result, outStrideStart + outStrideOffset, 1);
                view[0] = floatValue;
                outStrideOffset += 2;
                j++;
            } else if (type === "sbyte-norm") {
                const view = new Int8Array(result, outStrideStart + outStrideOffset, 1);
                // Expect value to be in -1...1 range
                if (floatValue < -1 || floatValue > 1) {
                    console.warn(`Byte value is out of range - ${floatValue}`);
                }
                view[0] = Math.round(floatValue * 127);
                outStrideOffset += 1;
                j++;
            } else if (type === "sbyte") {
                const view = new Int8Array(result, outStrideStart + outStrideOffset, 1);
                // Scale value, expect it to fit in -127...127 range
                const scaledValue = floatValue * scale;
                if (scaledValue < -127 || scaledValue > 127) {
                    console.warn(`Byte value is out of range - ${floatValue} (scale is ${scale})`);
                }
                view[0] = Math.round(scaledValue);
                outStrideOffset += 1;
                j++;
            } else if (type === "ubyte-norm") {
                const view = new Uint8Array(result, outStrideStart + outStrideOffset, 1);
                // Expect value to be in 0...1 range
                if (floatValue < 0 || floatValue > 1) {
                    console.warn(`Unsigned byte value is out of range - ${floatValue}`);
                }
                view[0] = Math.round(floatValue * 255);
                outStrideOffset += 1;
                j++;
            } else if (type === "ubyte") {
                const view = new Uint8Array(result, outStrideStart + outStrideOffset, 1);
                // Expect value to be in 0...255 range
                if (floatValue < 0) { // strange fix for negative values
                    floatValue = 1 - floatValue;
                }
                if (floatValue < 0 || floatValue > 255) {
                    console.warn(`Unsigned byte value is out of range - ${floatValue}`);
                }
                view[0] = Math.round(floatValue);
                outStrideOffset += 1;
                j++;
            } else if (type === "packed3-normalized") {
                const temp = new Uint32Array(1);
                const tempView = new Uint8Array(temp.buffer);
                const view = new Uint8Array(result, outStrideStart + outStrideOffset, 4);
                temp[0] = pack3FloatsNormalized(
                    input[i * strideSize + j + 0],
                    input[i * strideSize + j + 1],
                    input[i * strideSize + j + 2]
                ) >>> 0;
                view[0] = tempView[0];
                view[1] = tempView[1];
                view[2] = tempView[2];
                view[3] = tempView[3];
                outStrideOffset += 4;
                j += 3;
            } else if (type === "packed3") {
                const temp = new Uint32Array(1);
                const tempView = new Uint8Array(temp.buffer);
                const view = new Uint8Array(result, outStrideStart + outStrideOffset, 4);
                temp[0] = pack3Floats(
                    input[i * strideSize + j + 0],
                    input[i * strideSize + j + 1],
                    input[i * strideSize + j + 2]
                ) >>> 0;
                view[0] = tempView[0];
                view[1] = tempView[1];
                view[2] = tempView[2];
                view[3] = tempView[3];
                outStrideOffset += 4;
                j += 3;
            }
        }
    }

    const outputFile = path.join(path.dirname(argv._[0]), "output", path.basename(argv._[0]));
    fs.writeFileSync(outputFile, new Buffer.from(result));

    const diff = input.byteLength - result.byteLength;
    const percentageDiff = Math.round(diff / input.byteLength * 100);
    console.log(`Saved ${diff} bytes (${percentageDiff}% smaller than original).`);
});
