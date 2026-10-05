import test from 'node:test';
import assert from 'node:assert/strict';
import { Gesture } from '../src/gesture.js';

const event = (x, y, timeStamp = 0, pointerId = 1) => ({ clientX: x, clientY: y, timeStamp, pointerId });

test('a tap and finger jitter do not start rotation', () => {
  const gesture = new Gesture(event(100, 100));
  assert.deepEqual(gesture.move(event(104, 102, 20)), { x: 0, y: 0 });
  assert.equal(gesture.release(event(100, 100, 40)).dragging, false);
});
test('rotation starts before release and follows a reversed movement', () => {
  const gesture = new Gesture(event(100, 100));
  assert.deepEqual(gesture.move(event(120, 100, 20)), { x: 20, y: 0 });
  assert.equal(gesture.dragging, true);
  assert.deepEqual(gesture.move(event(110, 100, 40)), { x: -10, y: 0 });
  const release = gesture.release(event(110, 100, 60));
  assert.deepEqual(release.direction, { x: -1, y: 0 });
});
test('a diagonal gesture preserves both directions', () => {
  const gesture = new Gesture(event(0, 0));
  gesture.move(event(20, 20, 20));
  const { direction } = gesture.release(event(20, 20, 40));
  assert.ok(direction.x > 0 && direction.y > 0);
});
test('a second pointer cannot move or finish the active gesture', () => {
  const gesture = new Gesture(event(0, 0));
  assert.equal(gesture.move(event(100, 100, 10, 2)), null);
  assert.equal(gesture.release(event(100, 100, 20, 2)), null);
  assert.equal(gesture.dragging, false);
});
test('a pause before release keeps the last direction with zero speed', () => {
  const gesture = new Gesture(event(100, 100));
  gesture.move(event(100, 80, 20));
  const release = gesture.release(event(100, 80, 500));
  assert.deepEqual(release.direction, { x: 0, y: -1 });
  assert.equal(release.speed, 0);
});
test('movement reported only at release is still classified as a drag', () => {
  const gesture = new Gesture(event(0, 0));
  assert.equal(gesture.release(event(20, 0, 20)).dragging, true);
});
