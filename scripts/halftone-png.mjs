import { deflateSync } from "node:zlib";
export function png(width, height, rgba) {
  function chunk(type, data) {
    const bytes = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    const length = Buffer.alloc(4),
      sum = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    sum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, bytes, sum]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 4;
  header[9] = 3;
  const palette = Buffer.alloc(48);
  for (let i = 0; i < 16; i++) {
    palette[i * 3] = Math.round(19 + (225 * i) / 15);
    palette[i * 3 + 1] = Math.round(23 + (221 * i) / 15);
    palette[i * 3 + 2] = Math.round(21 + (221 * i) / 15);
  }
  const stride = Math.ceil(width / 2) + 1,
    rows = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const shade = Math.max(
        0,
        Math.min(15, Math.round(((rgba[(y * width + x) * 4] - 19) / 225) * 15)),
      );
      rows[y * stride + 1 + (x >> 1)] |= shade << (x % 2 ? 0 : 4);
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("PLTE", palette),
    chunk("IDAT", deflateSync(rows, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
