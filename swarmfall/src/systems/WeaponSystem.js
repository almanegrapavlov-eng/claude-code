// Weapon skeleton.
//
// Owns the player's automatic weapons, ticks their cooldowns, and spawns
// projectiles at the right targets. Added in a later step (see DESIGN.md).
// No weapons fire yet.
export class WeaponSystem {
  constructor() {
    this.projectiles = [];
  }

  // TODO (later step): tick weapon cooldowns and fire automatically.
  update(dt, game) {}
}
