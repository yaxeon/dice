import test from 'node:test';
import assert from 'node:assert/strict';
import { randomInteger } from '../src/random.js';

function source(values) {
  let index = 0;
  return { getRandomValues(array) {
    assert.ok(index < values.length, 'Unexpected extra random draw');
    array[0] = values[index++];
    return array;
  } };
}

for (const sides of [4, 6, 8, 10]) {
  test(`all ${sides} outcomes, including the upper bound, are reachable`, () => {
    const rng = source(Array.from({ length: sides }, (_, index) => index));
    assert.deepEqual(Array.from({ length: sides }, () => randomInteger(sides, rng)), Array.from({ length: sides }, (_, index) => index + 1));
  });
}

for (const sides of [6, 10]) {
  test(`the biased tail is rejected for d${sides}`, () => {
    const limit = Math.floor(2 ** 32 / sides) * sides;
    assert.equal(randomInteger(sides, source([2 ** 32 - 1, limit, limit - 1])), sides);
  });
}

test('zero and the largest accepted input work for d4 and d8', () => {
  for (const sides of [4, 8]) {
    assert.equal(randomInteger(sides, source([0])), 1);
    assert.equal(randomInteger(sides, source([2 ** 32 - 1])), sides);
  }
});
test('successive rolls may repeat', () => {
  const rng = source([0, 0]);
  assert.equal(randomInteger(6, rng), randomInteger(6, rng));
});
test('invalid bounds and an unavailable crypto source fail explicitly', () => {
  for (const invalid of [0, -1, 1.5, NaN, Infinity, 2 ** 32 + 1]) {
    assert.throws(() => randomInteger(invalid), RangeError);
  }
  assert.throws(() => randomInteger(6, null), /unavailable/);
});
test('real Web Crypto values stay in each supported range', () => {
  for (const sides of [4, 6, 8, 10]) {
    for (let index = 0; index < 1000; index += 1) {
      const value = randomInteger(sides);
      assert.ok(Number.isInteger(value) && value >= 1 && value <= sides);
    }
  }
});
