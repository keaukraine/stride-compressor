const { Float16Array } = require("@petamoriken/float16");
const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

const intValue = -3;

function dec2bin(dec) {
    let str = (dec >>> 0).toString(2);
    for (; str.length < 32;) {
        str = "0" + str;
    }
    return str;
}

const x = intValue & 0x000003FF;
const y = intValue << 10 & 0x000FFC00;
const z = intValue << 20 & 0x3FF00000;

console.log(dec2bin(intValue));
console.log(dec2bin(x));
console.log(dec2bin(y));
console.log(dec2bin(z));
console.log(dec2bin(x | y | z));

console.log("wwzzzzzzzzzzyyyyyyyyyyxxxxxxxxxx")

process.exit(0);


/**
 * node src/compressor.js buddha-strides.bin --stride=FFF-hh-hh-hhh
 */

const argv = yargs.argv;
const strideFormat = argv.stride;
let strideSize = 0; // Stride size in floats (items count)
let outStrideSize = 0; // Output stride size in bytes
const types = [];

let i = 0;
for (const type of strideFormat) {
    switch (type) {
        case "p":
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
        case "B":
        case "b":
            strideSize += 1;
            outStrideSize += 1;
            types[i++] = "sbyte";
            break;
        case "U":
        case "u":
            strideSize += 1;
            outStrideSize += 1;
            types[i++] = "ubyte";
            break;
    }
}

const padding = (Math.ceil(outStrideSize / 4) * 4) - outStrideSize;

console.log(`Original stride size ${strideSize * 4} bytes; new stride size ${outStrideSize + padding} bytes (including padding last ${padding} bytes).`);

fs.readFile(argv._[0], (err, data) => {
    const input = new Float32Array(data.buffer, 0, data.byteLength / 4);
    const result = new ArrayBuffer(data.byteLength / strideSize / 4 * (outStrideSize + padding));

    for (let i = 0; i < input.length / strideSize; i++) {
        const outStrideStart = i * (outStrideSize + padding);
        let outStrideOffset = 0;
        for (let j = 0; j < strideSize; j++) {
            const floatValue = input[i * strideSize + j];
            if (types[j] === "float") {
                const view = new Float32Array(result, outStrideStart + outStrideOffset, 1);
                view[0] = floatValue;
                outStrideOffset += 4;
            } else if (types[j] === "half") {
                const view = new Float16Array(result, outStrideStart + outStrideOffset, 1);
                view[0] = floatValue;
                outStrideOffset += 2;
            } else if (types[j] === "sbyte") {
                const view = new Int8Array(result, outStrideStart + outStrideOffset, 1);
                // Expect value to be in -1...1 range
                view[0] = Math.floor(floatValue * 127);
                outStrideOffset += 1;
            } else if (types[j] === "ubyte") {
                const view = new Uint8Array(result, outStrideStart + outStrideOffset, 1);
                // Expect value to be in 0...1 range
                view[0] = Math.floor(floatValue * 255);
                outStrideOffset += 1;
            }
        }
    }

    const outputFile = path.join(path.dirname(argv._[0]), "output", path.basename(argv._[0]));
    fs.writeFileSync(outputFile, new Buffer.from(result));

    const diff = input.byteLength - result.byteLength;
    const percentageDiff = Math.round(diff / input.byteLength * 100);
    console.log(`Saved ${diff} bytes (${percentageDiff}% smaller than original).`);
});
