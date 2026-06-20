import {
  VIEW_WIDTH,
  VIEW_HEIGHT,
  UI_HP_BAR_WIDTH,
  UI_HP_BAR_HEIGHT,
} from '../core/Constants.js';
import { drawHealthBar } from '../render/HealthBar.js';

// Draws the heads-up display in screen space (the camera does not affect it):
// title, survival timer, kills, a big player HP bar, a small debug block, and
// the game-over overlay.
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
    this._text(ctx, `Enemies: ${game.spawner.enemies.length}`, 28, 58);
    this._text(
      ctx,
      `Player: (${Math.round(game.player.x)}, ${Math.round(game.player.y)})`,
      28,
      88
    );

    // Big player HP bar, centered along the bottom.
    const player = game.player;
    const barTop = VIEW_HEIGHT - 56;
    drawHealthBar(
      ctx,
      VIEW_WIDTH / 2,
      barTop,
      UI_HP_BAR_WIDTH,
      UI_HP_BAR_HEIGHT,
      player.hp / player.maxHp
    );
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    this._text(
      ctx,
      `${Math.ceil(player.hp)} / ${player.maxHp}`,
      VIEW_WIDTH / 2,
      barTop + UI_HP_BAR_HEIGHT / 2
    );

    ctx.restore();
  }

  // Full-screen overlay shown when the run ends.
  renderGameOver(ctx, game) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 10, 14, 0.72)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = VIEW_WIDTH / 2;
    let y = VIEW_HEIGHT / 2 - 210;

    ctx.fillStyle = '#ff5d6c';
    ctx.font = 'bold 110px system-ui, sans-serif';
    ctx.fillText('GAME OVER', cx, y);

    y += 150;
    ctx.fillStyle = '#ffffff';
    ctx.font = '40px system-ui, sans-serif';
    ctx.fillText(`Survived   ${this._formatTime(game.elapsed)}`, cx, y);
    y += 60;
    ctx.fillText(`Enemies defeated   ${game.kills}`, cx, y);
    y += 60;
    ctx.fillText(`Level reached   ${game.level}`, cx, y);

    // Restart button.
    y += 120;
    const bw = 360;
    const bh = 84;
    ctx.fillStyle = '#37d1c4';
    ctx.fillRect(cx - bw / 2, y - bh / 2, bw, bh);
    ctx.fillStyle = '#06231f';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText('RESTART', cx, y);

    y += 86;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText('Press R or click to restart', cx, y);

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
