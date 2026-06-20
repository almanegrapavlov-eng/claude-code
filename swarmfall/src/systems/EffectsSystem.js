import { DamageNumber } from '../entities/DamageNumber.js';
import { MAX_DAMAGE_NUMBERS } from '../core/Constants.js';

// Owns short-lived cosmetic effects. Right now that's just floating damage
// numbers; future juice (hit sparks, pickups) can live here too.
export class EffectsSystem {
  constructor() {
    this.damageNumbers = [];
  }

  spawnDamage(x, y, value) {
    // Drop the oldest if we somehow flood with numbers, to protect performance.
    if (this.damageNumbers.length >= MAX_DAMAGE_NUMBERS) this.damageNumbers.shift();
    this.damageNumbers.push(new DamageNumber(x, y, value));
  }

  update(dt) {
    for (const d of this.damageNumbers) d.update(dt);
    this.damageNumbers = this.damageNumbers.filter((d) => d.alive);
  }

  render(ctx, camera) {
    for (const d of this.damageNumbers) d.render(ctx, camera);
  }
}
