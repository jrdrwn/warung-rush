// Warung Rush — the entry point: the game loop, the screens, and the
// screenshot scenes. The kitchen owns the rules, the renderer owns the
// drawing; this file only wires them together and steps the clock.

import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { mulberry32 } from './random.js';
import { createInput } from './input.js';
import { createKitchen } from './kitchen.js';
import { drawScreen } from './render.js';
import { stageShot } from './shots.js';
import { ensureAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam !== 0 ? seedParam : (Date.now() % 2147483647);
const rng = mulberry32(seed);

const input = createInput(canvas);
const kitchen = createKitchen(rng);

// A handle for play-testing from the browser console or automation: the live
// kitchen state, so a test can read the score, the timer and the orders.
window.__warung = { kitchen, input };

let screen = 'title';
if (shotName) {
  const staged = stageShot(shotName, kitchen);
  screen = staged.screen;
  kitchen.state.screen = 'playing';
  drawScreen(ctx, kitchen, 0);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (screen === 'title') {
      if (input.wasPressed('enter') || input.wasClicked()) {
        ensureAudio();
        kitchen.start();
        screen = 'playing';
        input.reset();
      }
    } else if (screen === 'playing') {
      if (input.wasPressed('m')) toggleMute();
      kitchen.update(dt, input);
      if (kitchen.state.screen === 'over') screen = 'over';
    } else if (screen === 'over') {
      if (input.wasPressed('r') || input.wasPressed('enter')) {
        kitchen.start();
        screen = 'playing';
        input.reset();
      }
    }
    drawScreen(ctx, kitchen, now / 1000);
    requestAnimationFrame(frame);
  }
  drawScreen(ctx, kitchen, 0);
  requestAnimationFrame(frame);
}
