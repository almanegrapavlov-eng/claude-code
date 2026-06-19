// Draws all HUD elements on top of the game world.
// All coordinates are in the fixed 1920x1080 canvas space.
export class UISystem {

  draw(ctx, game, fps) {
    this._drawDebugInfo(ctx, game.player, fps);
    this._drawTimer(ctx, game.elapsed);
    this._drawKillCount(ctx, game.killCount);
    this._drawHPBar(ctx, game.player);
    this._drawXPBar(ctx, game.player);
    this._drawLevel(ctx, game.player);
  }

  // ---- Survival timer — top center ----
  _drawTimer(ctx, elapsed) {
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = Math.floor(elapsed % 60).toString().padStart(2, '0');

    ctx.save();
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(`${mins}:${secs}`, 960, 52);
    ctx.restore();
  }

  // ---- Kill counter — top right ----
  _drawKillCount(ctx, kills) {
    ctx.save();
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`☠ ${kills}`, 1904, 36);
    ctx.restore();
  }

  // ---- FPS + player coords — top left (debug) ----
  _drawDebugInfo(ctx, player, fps) {
    ctx.save();
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';

    ctx.fillStyle = fps >= 50 ? '#00ff88' : fps >= 30 ? '#ffdd00' : '#ff4444';
    ctx.fillText(`FPS: ${fps}`, 16, 30);

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`X: ${Math.round(player.x)}  Y: ${Math.round(player.y)}`, 16, 52);

    ctx.restore();
  }

  // ---- HP bar — bottom left ----
  _drawHPBar(ctx, player) {
    const x = 20, y = 1036, w = 320, h = 28;
    this._drawBar(ctx, x, y, w, h, player.hp / player.maxHp, '#e63946', 'rgba(30,10,10,0.8)');

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
    this._drawBar(ctx, x, y, w, h, player.xp / player.xpToNext, '#06d6a0', 'rgba(0,20,14,0.8)');

    ctx.save();
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`XP  ${player.xp} / ${player.xpToNext}`, x + 8, y + h - 7);
    ctx.restore();
  }

  // ---- Level badge ----
  _drawLevel(ctx, player) {
    ctx.save();
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`LVL ${player.level}`, 352, 1058);
    ctx.restore();
  }

  // ---- Reusable bar primitive ----
  _drawBar(ctx, x, y, w, h, fraction, fillColor, bgColor) {
    fraction = Math.max(0, Math.min(1, fraction));

    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w * fraction, h);

    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x, y, w * fraction, Math.floor(h * 0.35));

    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

}
