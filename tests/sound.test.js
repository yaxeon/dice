import test from 'node:test';
import assert from 'node:assert/strict';
import { DiceSound } from '../sound.js';

function audioContext() {
  return {
    state: 'suspended', currentTime: 0, sampleRate: 48000, destination: {}, sources: [],
    resume() { this.state = 'running'; return Promise.resolve(); },
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; },
    createGain() {
      return { gain: { value: 1, setTargetAtTime() {} }, connect() {}, disconnect() {} };
    },
    createBufferSource() {
      const source = {
        playbackRate: { value: 1 }, connect() {}, disconnect() {},
        start(time) { this.started = time; },
        stop(time) { this.stopped = time; },
      };
      this.sources.push(source);
      return source;
    },
  };
}

test('loading and unlocking are silent; movement starts the sound', () => {
  const context = audioContext();
  let created = 0;
  const sound = new DiceSound(() => { created += 1; return context; });
  sound.tick();
  assert.equal(created, 0);
  sound.unlock();
  assert.equal(created, 1);
  assert.equal(context.sources.length, 0);
  sound.tick();
  assert.equal(context.sources.length, 1);
});

test('multiple dice produce a bounded rattle rather than one sound per animation frame', () => {
  const context = audioContext();
  const sound = new DiceSound(() => context);
  sound.unlock();
  sound.tick(0, 3);
  assert.equal(context.sources.length, 3);
  assert.ok(context.sources[2].started - context.sources[0].started < .02);
  context.currentTime = .01;
  sound.tick(0, 3);
  assert.equal(context.sources.length, 3);
  context.currentTime = .2;
  sound.tick(1, 3);
  assert.equal(context.sources.length, 3);
});

test('completion or cancellation stops every voice and the next roll can sound immediately', () => {
  const context = audioContext();
  const sound = new DiceSound(() => context);
  sound.unlock();
  sound.tick(0, 3);
  sound.stop();
  assert.ok(context.sources.every(source => source.stopped === .015));
  assert.equal(sound.voices.size, 0);
  sound.stop();
  sound.tick();
  assert.equal(context.sources.length, 4);
});

test('unavailable or blocked audio does not throw or play late', async () => {
  for (const createContext of [() => null, () => { throw new Error('No audio device'); }]) {
    const sound = new DiceSound(createContext);
    assert.doesNotThrow(() => { sound.unlock(); sound.tick(); sound.stop(); });
  }
  const context = audioContext();
  context.resume = () => Promise.reject(new Error('Autoplay blocked'));
  const sound = new DiceSound(() => context);
  sound.unlock();
  await Promise.resolve();
  sound.tick();
  sound.stop();
  assert.equal(context.sources.length, 0);
});
