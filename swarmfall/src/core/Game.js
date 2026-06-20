import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { Renderer } from '../systems/Renderer.js';
import { UISystem } from '../systems/UISystem.js';
import { Spawner } from '../systems/Spawner.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { ProceduralSprites } from '../assets/ProceduralSprites.js';

// Central game object: owns the state and systems, and runs the main loop.
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Long-lived helpers/systems (survive a restart).
    this.input = new Input();
    this.camera = new Camera();
    this.sprites = new ProceduralSprites();
    this.renderer = new Renderer(this.ctx);
    this.ui = new UISystem();
    this.collision = new CollisionSystem(); // stateless

    // Loop timing.
    this._lastTime = 0;
    this.fps = 0;
    this._frame = this._frame.bind(this);

    this._startRun();
    this._bindRestart();
  }

  // Initialize (or reset) everything that belongs to a single run.
  _startRun() {
    this.player = new Player(0, 0);
    this.camera.follow(this.player);
    this.camera.resetShake();

    this.spawner = new Spawner();
    this.weapon = new WeaponSystem();
    this.effects = new EffectsSystem();

    this.elapsed = 0; // survival time, in seconds
    this.kills = 0;
    this.level = 1; // leveling isn't implemented yet; shown on the game-over screen
    this.state = 'playing'; // 'playing' | 'gameover'
  }

  reset() {
    this._startRun();
  }

  // Restart on R or a click/tap, but only once the run is over.
  _bindRestart() {
    const restart = () => {
      if (this.state === 'gameover') this.reset();
    };
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR') restart();
    });
    this.canvas.addEventListener('pointerdown', restart);
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
    // When the run is over the world freezes; only restart input is handled
    // (via the listeners in _bindRestart).
    if (this.state !== 'playing') return;

    this.elapsed += dt;
    this.camera.update(dt); // advance screen shake
    this.player.update(dt, this.input);
    this.camera.follow(this.player);

    // Systems run in order: spawn/move enemies, fire/move projectiles, resolve
    // collisions, then advance cosmetic effects.
    this.spawner.update(dt, this);
    this.weapon.update(dt, this);
    this.collision.update(dt, this);
    this.effects.update(dt);

    // Remove anything that died or left the screen this frame.
    this.spawner.removeDead();
    this.weapon.removeDead(this.camera);

    if (this.player.hp <= 0) {
      this.state = 'gameover';
      this.camera.resetShake(); // freeze the final frame steady
    }
  }

  render() {
    const { ctx, camera, sprites } = this;

    this.renderer.clear();

    // World layer — shifted by the camera shake so the HUD stays steady.
    ctx.save();
    ctx.translate(camera.shakeX, camera.shakeY);
    this.renderer.drawBackground(camera);
    for (const e of this.spawner.enemies) e.render(ctx, camera, sprites);
    for (const p of this.weapon.projectiles) p.render(ctx, camera);
    this.player.render(ctx, camera, sprites);
    this.effects.render(ctx, camera); // damage numbers on top
    ctx.restore();

    // HUD layer.
    this.ui.render(ctx, this);
    if (this.state === 'gameover') this.ui.renderGameOver(ctx, this);
  }
}
