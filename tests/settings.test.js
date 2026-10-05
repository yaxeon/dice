import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSettings, saveSettings, validateSettings } from '../src/settings.js';

test('saved settings restore and invalid values fall back independently', () => {
  assert.deepEqual(loadSettings(() => ({ getItem: () => '{"count":3,"sides":10}' })), { count: 3, sides: 10 });
  assert.deepEqual(validateSettings({ count: 2, sides: 20 }), { count: 2, sides: 6 });
  assert.deepEqual(validateSettings({ count: '3', sides: 8 }), { count: 1, sides: 8 });
});
test('missing, malformed or inaccessible storage never blocks the app', () => {
  for (const value of [null, '{broken', 'null', '42']) {
    assert.deepEqual(loadSettings(() => ({ getItem: () => value })), { count: 1, sides: 6 });
  }
  const blocked = () => { throw new Error('Storage blocked'); };
  assert.deepEqual(loadSettings(blocked), { count: 1, sides: 6 });
  assert.doesNotThrow(() => saveSettings({ count: 3, sides: 10 }, blocked));
  assert.doesNotThrow(() => saveSettings({ count: 3, sides: 10 }, () => ({ setItem() { throw new Error('Quota exceeded'); } })));
});
