// Draws all HUD elements on top of the game world.
// All coordinates are in the fixed 1920x1080 canvas space.
export class UISystem {

  draw(ctx, game, fps) {
    this._drawDebugInfo(ctx, game.player, fps);
    this._drawTitle(ctx);
    this._drawHPBar(ctx, game.player);
    this._drawXPBar(ctx, game.player);
    this._drawLevel(ctx, game.player);
  }

  // ---- Title (subtle watermark) ----
  _drawTitle(ctx) {
    ctx.save();
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.textAlign = 'center';
    ctx.fillText('HORDE SURVIVAL', 960, 36);
    ctx.restore();
  }

  // ---- FPS counter and player world position ----
  _drawDebugInfo(ctx, player, fps) {
    ctx.save();
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';

    ctx.fillStyle = fps >= 50 ? '#00ff88' : fps >= 30 ? '#ffdd00' : '#ff4444';
    ctx.fillText(`FPS: ${fps}`, 16, 30);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText(`X: ${Math.round(player.x)}   Y: ${Math.round(player.y)}`, 16, 54);

    ctx.restore();
  }

  // ---- HP bar — bottom left ----
  _drawHPBar(ctx, player) {
    const x = 20, y = 1036, w = 320, h = 28;
    const fraction = player.hp / player.maxHp;

    this._drawBar(ctx, x, y, w, h, fraction, '#e63946', 'rgba(30,10,10,0.8)');

    ctx.save();
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`HP  ${Math.ceil(player.hp)} / ${player.maxHp}`, x + 8, y + h - 7);
    ctx.restore();
  }

  // ---- XP bar — bottom center ----
  _drawXPBar(ctx, player) {
    const x = 360, y = 1036, w = 560, h = 28;
    const fraction = player.xp / player.xpToNext;

    this._drawBar(ctx, x, y, w, h, fraction, '#06d6a0', 'rgba(0,20,14,0.8)');

    ctx.save();
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`XP  ${player.xp} / ${player.xpToNext}`, x + 8, y + h - 7);
    ctx.restore();
  }

  // ---- Level badge — left of XP bar ----
  _drawLevel(ctx, player) {
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LVL ${player.level}`, 352, 1058);
    ctx.restore();
  }

  // ---- Reusable bar primitive ----
  _drawBar(ctx, x, y, w, h, fraction, fillColor, bgColor) {
    fraction = Math.max(0, Math.min(1, fraction));

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);

    // Fill
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w * fraction, h);

    // Thin highlight stripe
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x, y, w * fraction, Math.floor(h * 0.35));

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

}
