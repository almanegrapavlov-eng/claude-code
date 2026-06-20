import { VIEW_WIDTH } from '../core/Constants.js';

// Draws the heads-up display in screen space (the camera does not affect it).
// For this step: the title, current FPS, and the player's world position.
export class UISystem {
  render(ctx, game) {
    ctx.save();
    ctx.textBaseline = 'top';

    // Title and hint, centered near the top.
    ctx.textAlign = 'center';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    this._text(ctx, 'SWARMFALL', VIEW_WIDTH / 2, 28);

    ctx.font = '24px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this._text(ctx, 'Prototype — move with WASD or the Arrow Keys', VIEW_WIDTH / 2, 96);

    // Debug readouts, top-left.
    ctx.textAlign = 'left';
    ctx.font = '28px ui-monospace, monospace';
    ctx.fillStyle = '#8be9fd';
    const px = Math.round(game.player.x);
    const py = Math.round(game.player.y);
    this._text(ctx, `FPS: ${Math.round(game.fps)}`, 28, 28);
    this._text(ctx, `Player: (${px}, ${py})`, 28, 64);

    ctx.restore();
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
