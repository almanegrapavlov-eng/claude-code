import { MathUtils } from '../core/MathUtils.js';

// Schedules enemy spawns based on elapsed game time.
// Difficulty ramps up continuously — more enemies, faster, tougher.
export class Spawner {

  constructor() {
    this.elapsed      = 0;  // total seconds since run start
    this._spawnTimer  = 0;
    this._spawnRate   = 1.5; // seconds between spawns at t=0
  }

  // Placeholder — enemy factory and wave logic added in next step.
  update(dt, player, enemies) {
    this.elapsed     += dt;
    this._spawnTimer += dt;

    // TODO: spawn enemies when timer exceeds current spawnRate
    // TODO: reduce spawnRate as elapsed grows
  }

  // Returns a world-space spawn point just outside the visible screen.
  _randomSpawnPoint(player) {
    const angle = MathUtils.randomAngle();
    const dist  = 750 + MathUtils.randomRange(0, 200); // just off-screen
    return {
      x: player.x + Math.cos(angle) * dist,
      y: player.y + Math.sin(angle) * dist,
    };
  }

}
