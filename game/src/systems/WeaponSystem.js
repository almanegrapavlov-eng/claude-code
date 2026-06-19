// Manages all active weapons and fires them automatically each frame.
// Weapons are plain config objects registered with addWeapon().
export class WeaponSystem {

  constructor() {
    this.weapons     = []; // active weapon configs
    this.projectiles = []; // live Projectile instances (shared ref from Game)
  }

  // Register a weapon config. Config shape defined per-weapon in next step.
  addWeapon(config) {
    this.weapons.push({ ...config, _timer: 0 });
  }

  // Placeholder — weapon fire logic implemented in next step.
  update(dt, player, enemies) {
    // TODO: tick weapon timers, spawn projectiles
  }

}
