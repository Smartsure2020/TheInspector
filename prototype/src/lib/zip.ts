// Minimal store-only ZIP writer (Chunk 1E — evidence pack). No dependencies,
// no compression (JPEG/PNG payloads are already compressed), no encryption,
// deliberately no hashing/integrity chain (Tier B hardening, out of scope).
// Implements just enough of APPNOTE.TXT: local file headers + central
// directory + end-of-central-directory, method 0 (stored), CRC-32.
import "server-only";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry { name: string; data: Buffer }

/** Build a stored (uncompressed) ZIP from named entries. */
export function buildZip(entries: ZipEntry[]): Buffer {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const e of entries) {
    const name = Buffer.from(e.name.replace(/\\/g, "/"), "utf8");
    const crc = crc32(e.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);      // local file header signature
    local.writeUInt16LE(20, 4);              // version needed
    local.writeUInt16LE(0x0800, 6);          // flags: UTF-8 names
    local.writeUInt16LE(0, 8);               // method: stored
    local.writeUInt16LE(0, 10);              // mod time (unset — prototype)
    local.writeUInt16LE(0, 12);              // mod date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(e.data.length, 18);  // compressed size
    local.writeUInt32LE(e.data.length, 22);  // uncompressed size
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);              // extra length

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);         // central directory signature
    cd.writeUInt16LE(20, 4);                 // version made by
    cd.writeUInt16LE(20, 6);                 // version needed
    cd.writeUInt16LE(0x0800, 8);             // flags: UTF-8
    cd.writeUInt16LE(0, 10);                 // method
    cd.writeUInt16LE(0, 12); cd.writeUInt16LE(0, 14); // time/date
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(e.data.length, 20);
    cd.writeUInt32LE(e.data.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt16LE(0, 30); cd.writeUInt16LE(0, 32);  // extra/comment len
    cd.writeUInt16LE(0, 34);                 // disk number
    cd.writeUInt16LE(0, 36);                 // internal attrs
    cd.writeUInt32LE(0, 38);                 // external attrs
    cd.writeUInt32LE(offset, 42);            // local header offset

    chunks.push(local, name, e.data);
    central.push(cd, name);
    offset += local.length + name.length + e.data.length;
  }

  const cdStart = offset;
  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);         // end of central directory
  eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6); // disk numbers
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);                 // comment length

  return Buffer.concat([...chunks, cdBuf, eocd]);
}

/** CSV cell escaping for the pack index. */
export const csv = (rows: (string | number | boolean | null | undefined)[][]): string =>
  rows.map((r) => r.map((c) => {
    const s = c === null || c === undefined ? "" : String(c);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\r\n") + "\r\n";
