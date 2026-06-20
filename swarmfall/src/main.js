import { VIEW_WIDTH, VIEW_HEIGHT } from './core/Constants.js';
import { Game } from './core/Game.js';

// Grab the canvas and set its internal drawing resolution. This is the fixed
// space the whole game works in; it never changes.
const canvas = document.getElementById('game');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

// Scale the canvas to fit the window while preserving 16:9. Only the on-screen
// (CSS) size changes — the 1920x1080 drawing buffer stays the same, so all game
// coordinates remain in the fixed internal resolution.
function resize() {
  const scale = Math.min(
    window.innerWidth / VIEW_WIDTH,
    window.innerHeight / VIEW_HEIGHT
  );
  canvas.style.width = `${Math.floor(VIEW_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_HEIGHT * scale)}px`;
}

window.addEventListener('resize', resize);
resize();

// Boot the game.
const game = new Game(canvas);
game.start();
