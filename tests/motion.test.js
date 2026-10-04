import test from 'node:test';
import assert from 'node:assert/strict';
import { REST_ROTATION, settleAxis, settleRotation, interpolateRotation } from '../motion.js';

test('settling preserves the requested direction across many turns', () => {
  for (const current of [-1080, -361, -25, 0, 359, 721, 1080]) {
    for (const direction of [-1, 1]) {
      const target = settleAxis(current, -25, direction);
      assert.ok((target - current) * direction >= 280);
      assert.ok(Math.abs(((target + 25) / 360) - Math.round((target + 25) / 360)) < 1e-10);
    }
  }
});
test('diagonal settling ends in the original visual orientation', () => {
  const from = { x: 74, y: -203, z: -8 };
  const to = settleRotation(from, { x: -1, y: 1 }, 1);
  assert.ok(to.x < from.x && to.y < from.y);
  for (const axis of ['x', 'y', 'z']) {
    assert.equal(Math.abs((to[axis] - REST_ROTATION[axis]) % 360), 0);
  }
  assert.deepEqual(interpolateRotation(from, to, 0), from);
  assert.deepEqual(interpolateRotation(from, to, 1), to);
});
test('an unused axis returns by the shortest route', () => {
  assert.equal(settleAxis(370, -18, 0), 342);
});
test('small perpendicular finger jitter does not add a full second-axis spin', () => {
  const from = { x: -1, y: 90, z: 0 };
  const to = settleRotation(from, { x: .999, y: .03 });
  assert.equal(to.x, 0);
  assert.ok(to.y > from.y);
});
