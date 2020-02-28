import decode from "./decode";

const decodeBase64 = (
  blurhash: string,
  width: number,
  height: number,
  punch?: number
) => {
  const pixels = decode(blurhash, width, height, punch);
debugger;
  var imageData = Array.from(pixels);
  var w = width;
  var h = height;
  var stream = [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52
  ];
  Array.prototype.push.apply(stream, bytes32(w));
  Array.prototype.push.apply(stream, bytes32(h));
  stream.push(0x08, 0x06, 0x00, 0x00, 0x00);
  Array.prototype.push.apply(stream, bytes32(crc32(stream, 12, 17)));
  var len = h * (w * 4 + 1);
  for (var y = 0; y < h; y++) imageData.splice(y * (w * 4 + 1), 0, 0);
  var blocks = Math.ceil(len / 32768);
  Array.prototype.push.apply(stream, bytes32(len + 5 * blocks + 6));
  var crcStart = stream.length;
  var crcLen = len + 5 * blocks + 6 + 4;
  stream.push(0x49, 0x44, 0x41, 0x54, 0x78, 0x01);
  for (var i = 0; i < blocks; i++) {
    var blockLen = Math.min(32768, len - i * 32768);
    stream.push(i == blocks - 1 ? 0x01 : 0x00);
    Array.prototype.push.apply(stream, bytes16sw(blockLen));
    Array.prototype.push.apply(stream, bytes16sw(~blockLen));
    var id = imageData.slice(i * 32768, i * 32768 + blockLen);
    Array.prototype.push.apply(stream, id);
  }
  Array.prototype.push.apply(stream, bytes32(adler32(imageData)));
  Array.prototype.push.apply(stream, bytes32(crc32(stream, crcStart, crcLen)));

  stream.push(0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44);
  Array.prototype.push.apply(
    stream,
    bytes32(crc32(stream, stream.length - 4, 4))
  );
  return (
    "data:image/png;base64," +
    btoa(
      stream
        .map(function(c) {
          return String.fromCharCode(c);
        })
        .join("")
    )
  );
};

export default decodeBase64;

function toUInt(n: number) {
  return n < 0 ? n + 4294967296 : n;
}
function bytes32(n: number) {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}
function bytes16sw(n: number) {
  return [n & 0xff, (n >>> 8) & 0xff];
}

function adler32(arr: number[], start?: number, len?: number) {
  switch (arguments.length) {
    case 0:
      start = 0;
    case 1:
      len = arr.length - start;
  }
  var a = 1,
    b = 0;
  for (var i = 0; i < len; i++) {
    a = (a + arr[start + i]) % 65521;
    b = (b + a) % 65521;
  }
  return toUInt((b << 16) | a);
}

function crc32(arr: number[], start: number, len: number) {
  switch (arguments.length) {
    case 0:
      start = 0;
    case 1:
      len = arr.length - start;
  }
  var table = (window as any).crctable;
  if (!table) {
    table = [];
    var c;
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = toUInt(c);
    }
    (window as any).crctable = table;
  }
  let d = 0xffffffff;
  for (var i = 0; i < len; i++)
    d = table[(d ^ arr[start + i]) & 0xff] ^ (d >>> 8);

  return toUInt(d ^ 0xffffffff);
}
