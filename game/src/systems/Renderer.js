import { ProceduralSprites } from '../assets/ProceduralSprites.js';

// Draws the game world each frame.
// Render order: background → gems → enemies → projectiles → player (top).
export class Renderer {

  draw(ctx, game) {
    const time = game.elapsed;

    // Clear
    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(0, 0, 1920, 1080);

    // Background grid
    ProceduralSprites.drawBackground(ctx, game.camera);

    // XP gems (none yet — placeholder for later)
    for (const gem of game.gems) {
      if (gem.active) gem.draw(ctx, game.camera);
    }

    // Enemies
    for (const enemy of game.enemies) {
      if (enemy.active) enemy.draw(ctx, game.camera, time);
    }

    // Projectiles
    for (const proj of game.projectiles) {
      if (proj.active) proj.draw(ctx, game.camera);
    }

    // Player (always on top)
    game.player.draw(ctx, game.camera);
  }

}
