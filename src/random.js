const UINT32_RANGE = 2 ** 32;

// Discard the incomplete tail so every possible result has the same number of inputs.
export function randomInteger(max, cryptoSource = globalThis.crypto) {
  if (!Number.isInteger(max) || max < 1 || max > UINT32_RANGE) {
    throw new RangeError('The upper bound must be an integer from 1 to 2^32.');
  }
  if (typeof cryptoSource?.getRandomValues !== 'function') {
    throw new Error('Web Crypto is unavailable.');
  }
  const limit = Math.floor(UINT32_RANGE / max) * max;
  const buffer = new Uint32Array(1);
  do {
    cryptoSource.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return (buffer[0] % max) + 1;
}
