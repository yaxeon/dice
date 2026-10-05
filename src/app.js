import { randomInteger } from './random.js';
import { loadSettings, saveSettings } from './settings.js';
import { Gesture } from './gesture.js';
import { REST_ROTATION, interpolateRotation, settleRotation } from './motion.js';
import { Die } from './dice.js';
import { DiceSound } from './sound.js';

const app = document.querySelector('#app');
const stage = document.querySelector('#stage');
const area = document.querySelector('#dice-area');
const result = document.querySelector('#result');
const error = document.querySelector('#error');
const buttons = [...document.querySelectorAll('[data-setting]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const sound = new DiceSound();
const directions = [
  { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
  { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
];
let settings = loadSettings();
let dice = [];
let phase = 'idle';
let gesture = null;
let beforeGesture = [];
let frame = 0;
let roll = null;
let rollNumber = 0;

document.addEventListener('pointerdown', () => { app.dataset.input = 'pointer'; }, { capture: true });
document.addEventListener('keydown', () => { app.dataset.input = 'keyboard'; }, { capture: true });

function setPhase(value) {
  phase = value;
  app.dataset.state = value;
  stage.setAttribute('aria-busy', String(value !== 'idle'));
  for (const button of buttons) button.disabled = value !== 'idle';
}

function describeResults(values = [], initial = false) {
  const configuration = `${settings.count} ${settings.count === 1 ? 'die' : 'dice'}, ${settings.sides} sides.`;
  const outcomes = values.length ? ` ${initial ? 'Initial values' : 'Result'}: ${values.join(', ')}.` : ' Dice are ready to roll.';
  stage.setAttribute('aria-label', `Roll the dice: tap or drag. ${configuration}${outcomes}`);
}

function renderSettings() {
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(settings[button.dataset.setting] === Number(button.value)));
  }
  area.dataset.count = settings.count;
  let initialValues;
  try {
    initialValues = Array.from({ length: settings.count }, () => randomInteger(settings.sides));
    error.hidden = true;
  } catch {
    initialValues = Array(settings.count).fill(null);
    showCryptoError();
  }
  dice = initialValues.map(value => new Die(settings.sides, value));
  area.replaceChildren(...dice.map(die => die.element));
  result.textContent = '';
  describeResults(initialValues.every(Number.isInteger) ? initialValues : [], true);
}

function showCryptoError() {
  error.textContent = 'The browser could not generate random numbers. Reload the page or open the app in a modern browser.';
  error.hidden = false;
}

function applyDrag(delta) {
  if (reducedMotion.matches) {
    if (gesture?.dragging) area.style.opacity = '.8';
    return;
  }
  for (const die of dice) {
    die.setRotation({ ...die.rotation, x: die.rotation.x - delta.y * .8, y: die.rotation.y + delta.x * .8 });
  }
}

function finishRoll() {
  if (!roll) return;
  sound.stop();
  cancelAnimationFrame(frame);
  const values = roll.values;
  for (const die of dice) die.setRotation(REST_ROTATION);
  area.style.opacity = '';
  roll = null;
  setPhase('idle');
  describeResults(values);
  rollNumber += 1;
  result.textContent = `Roll ${rollNumber}. ${values.map((value, index) => `Die ${index + 1}: ${value}`).join('. ')}.`;
}

function animateRoll(timestamp) {
  if (!roll) return;
  if (roll.started === null) roll.started = timestamp;
  const progress = Math.min((timestamp - roll.started) / roll.duration, 1);
  sound.tick(progress, settings.count);
  if (reducedMotion.matches) {
    area.style.opacity = String(.8 + .2 * progress);
  } else {
    dice.forEach((die, index) => {
      die.setRotation(interpolateRotation(roll.from[index], roll.to[index], progress), 1 + .03 * Math.sin(Math.PI * progress));
    });
  }
  if (progress === 1) finishRoll();
  else frame = requestAnimationFrame(animateRoll);
}

function startRoll(release = null) {
  sound.unlock();
  let values;
  let direction;
  let duration;
  try {
    values = dice.map(() => randomInteger(settings.sides));
    direction = release?.dragging ? release.direction : directions[randomInteger(directions.length) - 1];
    duration = reducedMotion.matches ? 120 : 449 + randomInteger(201);
  } catch {
    sound.stop();
    dice.forEach((die, index) => die.setRotation(beforeGesture[index] ?? REST_ROTATION));
    area.style.opacity = '';
    setPhase('idle');
    showCryptoError();
    return;
  }
  error.hidden = true;
  const from = dice.map(die => ({ ...die.rotation }));
  roll = {
    values, from, duration, started: null,
    to: from.map(rotation => settleRotation(rotation, direction, release?.speed ?? 0)),
  };
  dice.forEach((die, index) => die.setValue(values[index]));
  setPhase('rolling');
  if (document.hidden) finishRoll();
  else frame = requestAnimationFrame(animateRoll);
}

function releaseCapture(pointerId) {
  if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
}

function cancelGesture() {
  if (!gesture) return;
  sound.stop();
  const pointerId = gesture.pointerId;
  gesture = null;
  dice.forEach((die, index) => die.setRotation(beforeGesture[index]));
  area.style.opacity = '';
  setPhase('idle');
  releaseCapture(pointerId);
}

stage.addEventListener('pointerdown', event => {
  if (phase !== 'idle' || !event.isPrimary || event.button !== 0) return;
  sound.unlock();
  event.preventDefault();
  stage.focus({ preventScroll: true });
  beforeGesture = dice.map(die => ({ ...die.rotation }));
  gesture = new Gesture(event);
  setPhase('tracking');
  try {
    stage.setPointerCapture(event.pointerId);
  } catch {
    cancelGesture();
  }
});

stage.addEventListener('pointermove', event => {
  if (!gesture) return;
  const delta = gesture.move(event);
  if (delta) applyDrag(delta);
});

stage.addEventListener('pointerup', event => {
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  const release = gesture.release(event);
  applyDrag(release.delta);
  gesture = null;
  releaseCapture(event.pointerId);
  startRoll(release);
});

stage.addEventListener('pointercancel', event => {
  if (gesture?.pointerId === event.pointerId) cancelGesture();
});
stage.addEventListener('lostpointercapture', event => {
  if (gesture?.pointerId === event.pointerId) cancelGesture();
});
stage.addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  if (phase === 'idle' && !event.repeat) startRoll();
});
// Assistive technology can activate the button without a physical pointer.
stage.addEventListener('click', event => {
  if (event.detail === 0 && phase === 'idle') startRoll();
});

for (const button of buttons) {
  button.addEventListener('click', () => {
    if (phase !== 'idle') return;
    const key = button.dataset.setting;
    const value = Number(button.value);
    if (settings[key] === value) return;
    settings = { ...settings, [key]: value };
    saveSettings(settings);
    renderSettings();
    result.textContent = 'Settings changed. Dice are ready to roll.';
  });
}

window.addEventListener('blur', cancelGesture);
window.addEventListener('pagehide', () => { sound.stop(); });
window.addEventListener('resize', cancelGesture);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  cancelGesture();
  finishRoll();
});
reducedMotion.addEventListener('change', () => {
  cancelGesture();
  finishRoll();
});

renderSettings();
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register(new URL('./sw.js', import.meta.url)).catch(error => {
    console.warn('Offline setup failed:', error);
  });
}
