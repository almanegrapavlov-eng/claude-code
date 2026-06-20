import { VIEW_WIDTH } from '../core/Constants.js';

// Draws the heads-up display in screen space (the camera does not affect it):
// the title, the survival timer, the kill counter, and a small debug block.
export class UISystem {
  render(ctx, game) {
    ctx.save();
    ctx.textBaseline = 'top';

    // Title, centered at the top.
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    this._text(ctx, 'SWARMFALL', VIEW_WIDTH / 2, 22);

    // Survival timer, prominent under the title.
    ctx.font = 'bold 40px ui-monospace, monospace';
    ctx.fillStyle = '#ffe066';
    this._text(ctx, this._formatTime(game.elapsed), VIEW_WIDTH / 2, 84);

    // Kill counter, top-right.
    ctx.textAlign = 'right';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillStyle = '#ff8fab';
    this._text(ctx, `Kills: ${game.kills}`, VIEW_WIDTH - 28, 28);

    // Debug block, top-left.
    ctx.textAlign = 'left';
    ctx.font = '24px ui-monospace, monospace';
    ctx.fillStyle = '#8be9fd';
    this._text(ctx, `FPS: ${Math.round(game.fps)}`, 28, 28);
    this._text(ctx, `HP: ${game.player.hp}/${game.player.maxHp}`, 28, 58);
    this._text(ctx, `Enemies: ${game.spawner.enemies.length}`, 28, 88);
    this._text(
      ctx,
      `Player: (${Math.round(game.player.x)}, ${Math.round(game.player.y)})`,
      28,
      118
    );

    ctx.restore();
  }

  // Seconds -> mm:ss.
  _formatTime(seconds) {
    const total = Math.floor(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Draw text with a subtle drop shadow so it stays readable over any color.
  _text(ctx, text, x, y) {
    const color = ctx.fillStyle;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(text, x + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
}
