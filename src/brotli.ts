import { brotliDecompressSync } from 'node:zlib';
// Fontkit's decompressor contract accepts bytes and an optional output size.
// Node already provides Brotli, so the desktop bundle needs no JS decoder.
export = function decompress(data: Uint8Array): Buffer {
  return brotliDecompressSync(data);
};
