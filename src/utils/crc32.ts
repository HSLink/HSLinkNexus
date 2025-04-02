export function CRC32(data: Uint8Array, len: number, crc_value = 0xffffffff) {
  const st_const_value = 0x04c11db7;

  for (let i = 0; i < Math.floor((len + 3) / 4); i++) {
    let xbit = 0x80000000;
    let word = 0
    for (let j = 0; j < 4; j++) {
      if (i * 4 + j < len) {
        word |= data[i * 4 + j] << (j * 8);
      } else {
        word |= 0x00 << (j * 8);
      }
    }

    for (let bits = 0; bits < 32; bits++) {
      if ((crc_value & 0x80000000) !== 0) {
        crc_value = crc_value << 1
        crc_value = crc_value & 0xffffffff;
        crc_value = crc_value ^ st_const_value;
      } else {
        crc_value <<= 1;
        crc_value = crc_value & 0xffffffff;
      }
      if ((word & xbit) !== 0) {
        crc_value ^= st_const_value;
      }
      xbit >>>= 1;
    }
    crc_value >>>= 0
  }
  return crc_value >>> 0; // Ensure the result is a 32-bit unsigned integer
}