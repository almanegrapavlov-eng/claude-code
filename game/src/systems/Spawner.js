import { MathUtils } from '../core/MathUtils.js';
import { Enemy }     from '../entities/Enemy.js';

// Difficulty ramps up over time: more enemy types and faster spawn rate.
const SCHEDULE = [
  { from:   0, types: ['slime'],         interval: 2.0 },
  { from:  20, types: ['slime', 'bat'],  interval: 1.6 },
  { from:  45, types: ['slime', 'bat'],  interval: 1.1 },
  { from:  90, types: ['slime', 'bat'],  interval: 0.75 },
  { from: 150, types: ['slime', 'bat'],  interval: 0.5 },
];

const SPAWN_RADIUS     = 640; // world pixels from player — just off-screen
const SPAWN_RADIUS_VAR = 160; // random extra distance so they don't all appear at once
const MAX_ENEMIES      = 200; // hard cap to protect performance

export class Spawner {

  constructor() {
    this.elapsed      = 0;
    this._spawnTimer  = 0;
  }

  update(dt, player, enemies) {
    this.elapsed     += dt;
    this._spawnTimer += dt;

    const schedule = this._currentSchedule();

    if (this._spawnTimer >= schedule.interval && enemies.length < MAX_ENEMIES) {
      this._spawnTimer = 0;
      this._spawnEnemy(player, enemies, schedule.types);
    }
  }

  _currentSchedule() {
    let result = SCHEDULE[0];
    for (const entry of SCHEDULE) {
      if (this.elapsed >= entry.from) result = entry;
    }
    return result;
  }

  _spawnEnemy(player, enemies, types) {
    const angle = MathUtils.randomAngle();
    const dist  = SPAWN_RADIUS + MathUtils.randomRange(0, SPAWN_RADIUS_VAR);
    const x     = player.x + Math.cos(angle) * dist;
    const y     = player.y + Math.sin(angle) * dist;
    const type  = types[Math.floor(Math.random() * types.length)];

    enemies.push(Enemy.create(type, x, y));
  }

}
