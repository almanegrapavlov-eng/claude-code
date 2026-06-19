import { Input }           from './Input.js';
import { Camera }          from './Camera.js';
import { Player }          from '../entities/Player.js';
import { Renderer }        from '../systems/Renderer.js';
import { UISystem }        from '../systems/UISystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { WeaponSystem }    from '../systems/WeaponSystem.js';
import { Spawner }         from '../systems/Spawner.js';

// Game is the central object that owns all state and runs the loop.
// It wires together every system and entity, then drives update → draw each frame.
export class Game {

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    // Internal resolution — all game logic uses these coordinates.
    this.WIDTH  = 1920;
    this.HEIGHT = 1080;
    canvas.width  = this.WIDTH;
    canvas.height = this.HEIGHT;

    // ---- Core systems ----
    this.input     = new Input();
    this.camera    = new Camera();
    this.renderer  = new Renderer();
    this.ui        = new UISystem();
    this.collision = new CollisionSystem();
    this.weapons   = new WeaponSystem();
    this.spawner   = new Spawner();

    // ---- Entity lists ----
    this.player      = new Player();
    this.enemies     = [];
    this.projectiles = [];
    this.gems        = [];

    // ---- Timing ----
    this._lastTime  = 0;
    this._fps       = 0;
    this._fpsAccum  = 0;
    this._fpsFrames = 0;

    // Snap camera so there is no initial pan from (0,0) to player.
    this.camera.snapTo(this.player.x, this.player.y);
  }

  // Call once to begin the game loop.
  start() {
    requestAnimationFrame(ts => this._loop(ts));
  }

  // ---- Main loop ----
  _loop(timestamp) {
    // Delta time in seconds, capped to avoid spiral-of-death on tab focus restore.
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.1);
    this._lastTime = timestamp;

    this._trackFPS(dt);
    this._update(dt);
    this._draw();

    requestAnimationFrame(ts => this._loop(ts));
  }

  _trackFPS(dt) {
    this._fpsFrames++;
    this._fpsAccum += dt;
    if (this._fpsAccum >= 0.5) {
      this._fps       = Math.round(this._fpsFrames / this._fpsAccum);
      this._fpsFrames = 0;
      this._fpsAccum  = 0;
    }
  }

  _update(dt) {
    // Player
    this.player.update(dt, this.input);

    // Camera follows player
    this.camera.update(this.player.x, this.player.y, dt, this.player.vx, this.player.vy);

    // Systems (stubs for now — activated in later steps)
    this.spawner.update(dt, this.player, this.enemies);
    this.weapons.update(dt, this.player, this.enemies);
    this.collision.resolve(this.player, this.enemies, this.projectiles, this.gems);

    // Purge inactive entities
    this.enemies     = this.enemies    .filter(e => e.active);
    this.projectiles = this.projectiles.filter(p => p.active);
    this.gems        = this.gems       .filter(g => g.active);
  }

  _draw() {
    this.renderer.draw(this.ctx, this);
    this.ui.draw(this.ctx, this, this._fps);
  }

}
