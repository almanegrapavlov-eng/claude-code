import { Input }           from './Input.js';
import { Camera }          from './Camera.js';
import { Player }          from '../entities/Player.js';
import { Renderer }        from '../systems/Renderer.js';
import { UISystem }        from '../systems/UISystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { WeaponSystem }    from '../systems/WeaponSystem.js';
import { Spawner }         from '../systems/Spawner.js';

export class Game {

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    this.WIDTH  = 1920;
    this.HEIGHT = 1080;
    canvas.width  = this.WIDTH;
    canvas.height = this.HEIGHT;

    // ---- Systems ----
    this.input     = new Input();
    this.camera    = new Camera();
    this.renderer  = new Renderer();
    this.ui        = new UISystem();
    this.collision = new CollisionSystem();
    this.weapons   = new WeaponSystem();
    this.spawner   = new Spawner();

    // ---- Entities ----
    this.player      = new Player();
    this.enemies     = [];
    this.projectiles = [];
    this.gems        = [];

    // ---- Stats ----
    this.killCount = 0;
    this.elapsed   = 0; // seconds survived

    // ---- Timing ----
    this._lastTime  = 0;
    this._fps       = 0;
    this._fpsAccum  = 0;
    this._fpsFrames = 0;

    this.camera.snapTo(this.player.x, this.player.y);
  }

  start() {
    requestAnimationFrame(ts => this._loop(ts));
  }

  _loop(timestamp) {
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
    this.elapsed += dt;

    // Player
    this.player.update(dt, this.input);

    // Camera
    this.camera.update(this.player.x, this.player.y, dt, this.player.vx, this.player.vy);

    // Enemies
    for (const enemy of this.enemies) {
      enemy.update(dt, this.player);
    }

    // Projectiles
    for (const proj of this.projectiles) {
      proj.update(dt, this.camera);
    }

    // Weapons — pass projectile array so it can push into it directly
    this.weapons.update(dt, this.player, this.enemies, this.projectiles);

    // Collisions
    this.collision.resolve(this.player, this.enemies, this.projectiles, this.gems);

    // Count kills before purging
    for (const enemy of this.enemies) {
      if (enemy.justDied) {
        this.killCount++;
        enemy.justDied = false;
      }
    }

    // Spawner
    this.spawner.update(dt, this.player, this.enemies);

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
