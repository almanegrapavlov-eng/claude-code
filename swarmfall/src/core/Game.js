import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { Renderer } from '../systems/Renderer.js';
import { UISystem } from '../systems/UISystem.js';
import { Spawner } from '../systems/Spawner.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
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

    // Systems.
    this.renderer = new Renderer(this.ctx);
    this.ui = new UISystem();
    this.spawner = new Spawner();
    this.weapon = new WeaponSystem();
    this.collision = new CollisionSystem();

    // Entities. The player starts at the world origin, which the camera keeps
    // centered on screen.
    this.player = new Player(0, 0);
    this.camera.follow(this.player);

    // Run stats.
    this.elapsed = 0; // survival time, in seconds
    this.kills = 0;

    // Loop timing.
    this._lastTime = 0;
    this.fps = 0;
    this._frame = this._frame.bind(this);
  }

  start() {
    this._lastTime = performance.now();
    requestAnimationFrame(this._frame);
  }

  // One iteration of the main loop.
  _frame(now) {
    // Delta time in seconds, clamped so a background tab (which pauses rAF)
    // doesn't produce one giant jump when it resumes.
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
    this.elapsed += dt;

    this.player.update(dt, this.input);
    this.camera.follow(this.player);

    // Systems run in order: spawn/move enemies, fire/move projectiles, then
    // resolve all collisions for the frame.
    this.spawner.update(dt, this);
    this.weapon.update(dt, this);
    this.collision.update(dt, this);

    // Remove anything that died or left the screen this frame.
    this.spawner.removeDead();
    this.weapon.removeDead(this.camera);
  }

  render() {
    const { ctx, camera, sprites } = this;

    this.renderer.clear();
    this.renderer.drawBackground(camera);

    // Enemies under projectiles under the player, so the hero stays readable.
    for (const e of this.spawner.enemies) e.render(ctx, camera, sprites);
    for (const p of this.weapon.projectiles) p.render(ctx, camera);
    this.player.render(ctx, camera, sprites);

    this.ui.render(ctx, this);
  }
}
