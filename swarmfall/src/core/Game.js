import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { Renderer } from '../systems/Renderer.js';
import { UISystem } from '../systems/UISystem.js';
import { ProceduralSprites } from '../assets/ProceduralSprites.js';

// Central game object: owns the state and systems, and runs the main loop.
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Core helpers.
    this.input = new Input();
    this.camera = new Camera();
    this.sprites = new ProceduralSprites();

    // Systems that draw the frame.
    this.renderer = new Renderer(this.ctx);
    this.ui = new UISystem();

    // Entities. The player starts at the world origin, which the camera keeps
    // centered on screen.
    this.player = new Player(0, 0);
    this.camera.follow(this.player);

    // Loop timing.
    this._lastTime = 0;
    this.fps = 0;

    // Bind so requestAnimationFrame keeps the correct `this`.
    this._frame = this._frame.bind(this);
  }

  start() {
    this._lastTime = performance.now();
    requestAnimationFrame(this._frame);
  }

  // One iteration of the main loop.
  _frame(now) {
    // Delta time in seconds, clamped so a background tab (which pauses
    // rAF) doesn't produce one giant jump when it resumes.
    let dt = (now - this._lastTime) / 1000;
    this._lastTime = now;
    dt = Math.min(dt, 0.1);

    // Smooth the FPS readout so the number doesn't flicker every frame.
    if (dt > 0) this.fps += (1 / dt - this.fps) * 0.1;

    this.update(dt);
    this.render();

    requestAnimationFrame(this._frame);
  }

  update(dt) {
    this.player.update(dt, this.input);
    this.camera.follow(this.player);
  }

  render() {
    this.renderer.clear();
    this.renderer.drawBackground(this.camera);
    this.player.render(this.ctx, this.camera, this.sprites);
    this.ui.render(this.ctx, this);
  }
}
