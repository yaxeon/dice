export const COUNTS = Object.freeze([1, 2, 3]);
export const SIDES = Object.freeze([4, 6, 8, 10]);
export const DEFAULT_SETTINGS = Object.freeze({ count: 1, sides: 6 });
const STORAGE_KEY = 'rolldice.settings.v1';

export function validateSettings(value) {
  return {
    count: COUNTS.includes(value?.count) ? value.count : DEFAULT_SETTINGS.count,
    sides: SIDES.includes(value?.sides) ? value.sides : DEFAULT_SETTINGS.sides,
  };
}

export function loadSettings(getStorage = () => globalThis.localStorage) {
  try {
    return validateSettings(JSON.parse(getStorage().getItem(STORAGE_KEY)));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings, getStorage = () => globalThis.localStorage) {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(validateSettings(settings)));
  } catch {
    // Storage can be blocked or full. The current session still works normally.
  }
}
