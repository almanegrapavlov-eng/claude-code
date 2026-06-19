import { ProceduralSprites } from '../assets/ProceduralSprites.js';

// Draws the game world each frame.
// Order matters: background → gems → enemies → projectiles → player.
export class Renderer {

  draw(ctx, game) {
    // --- Clear to dark background color ---
    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(0, 0, 1920, 1080);

    // --- World background (scrolling grid) ---
    ProceduralSprites.drawBackground(ctx, game.camera);

    // --- XP Gems ---
    for (const gem of game.gems) {
      if (gem.active) gem.draw(ctx, game.camera);
    }

    // --- Enemies ---
    for (const enemy of game.enemies) {
      if (enemy.active) enemy.draw(ctx, game.camera);
    }

    // --- Projectiles ---
    for (const proj of game.projectiles) {
      if (proj.active) proj.draw(ctx, game.camera);
    }

    // --- Player (always on top of world entities) ---
    game.player.draw(ctx, game.camera);
  }

}
