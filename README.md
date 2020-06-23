# OpenGL ES 3.0 stride compressor

This is a command-line tool to change 32-bit IEEE-754 floating-point values to the following formats:

- half-precision floats
- normalized signed and unsigned bytes
- packed `INT_2_10_10_10_REV`

Usage:

```
node src/compressor.js strides.bin --stride=FFF-hh-hh-hhh
```

Stride parameter describes how floats read from source binary files are written to output binary file (which created under `/output` directory).

Different characters define conversion to different data types:
- `F`, `f` - 32-bit float (do not convert)
- `H`, `h` - 16-bit half precision float
- `B`, `b` - normalized signed byte
- `U`, `u` - normalized unsigned byte
- `p` - 3 floats packed into `INT_2_10_10_10_REV`
- `0` - adds 1 empty byte to align data

Any other characters are ignored and can be used for formatting.

# License

**The MIT License**

Copyright (c) 2020 Oleksandr Popov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
