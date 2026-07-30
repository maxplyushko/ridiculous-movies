export function randomInt(maxExclusive: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return Math.floor((buf[0] / (0xffffffff + 1)) * maxExclusive);
}
