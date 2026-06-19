import { Game } from './core/Game.js';

const GAME_W = 1920;
const GAME_H = 1080;
const ASPECT = GAME_W / GAME_H; // 16:9

// Resize the canvas's CSS dimensions to fill the browser window while
// keeping the 16:9 aspect ratio. The internal pixel size stays 1920×1080.
function fitCanvas(canvas) {
  const winW = window.innerWidth;
  const winH = window.innerHeight;

  if (winW / winH > ASPECT) {
    // Window is wider than 16:9 → letterbox on sides
    const h = winH;
    const w = h * ASPECT;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
  } else {
    // Window is taller than 16:9 → letterbox on top/bottom
    const w = winW;
    const h = w / ASPECT;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
  }
}

window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');

  fitCanvas(canvas);
  window.addEventListener('resize', () => fitCanvas(canvas));

  const game = new Game(canvas);
  game.start();
});
