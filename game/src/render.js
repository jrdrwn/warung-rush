// Warung Rush — every pixel the game draws: the warung, the stations, the
// cook, the order board, the prompts and the title and game-over screens.
// All art is drawn in code; the game loads no images.

import { CANVAS_HEIGHT, CANVAS_WIDTH, CHOP_TIME, COLORS, MENU, STATIONS } from './config.js';
import { ingredientName } from './kitchen.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

/** A filled rounded rectangle. */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/** A rounded rectangle outline, stroked only (never filled). */
function rrStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight ?? 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function outlineText(ctx, str, x, y, size, color, align, weight) {
  ctx.font = `${weight ?? 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(46,29,14,0.85)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

/** One ingredient drawn small, at (x, y) with the given size. */
export function drawIngredient(ctx, kind, x, y, size, chopped) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'nasi') {
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.arc(0, 2, s * 0.42, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e8d9b0';
    ctx.beginPath();
    ctx.ellipse(0, 2, s * 0.42, s * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'mie') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = s * 0.14;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(0, i * s * 0.16, s * 0.3, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  } else if (kind === 'telur') {
    if (chopped) {
      ctx.fillStyle = '#fff8e7';
      ctx.fillRect(-s * 0.3, -s * 0.2, s * 0.6, s * 0.4);
      ctx.fillStyle = '#f2a541';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.3, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2d8a7';
      ctx.beginPath();
      ctx.ellipse(s * 0.06, -s * 0.06, s * 0.16, s * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'ayam') {
    if (chopped) {
      ctx.fillStyle = '#c47b3a';
      ctx.fillRect(-s * 0.32, -s * 0.22, s * 0.28, s * 0.44);
      ctx.fillRect(s * 0.04, -s * 0.22, s * 0.28, s * 0.44);
      ctx.fillStyle = '#8a4f1d';
      ctx.fillRect(-s * 0.32, -s * 0.05, s * 0.28, s * 0.1);
      ctx.fillRect(s * 0.04, -s * 0.05, s * 0.28, s * 0.1);
    } else {
      ctx.fillStyle = '#c47b3a';
      ctx.beginPath();
      ctx.ellipse(-s * 0.08, 0, s * 0.34, s * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f6f2e7';
      ctx.lineWidth = s * 0.12;
      ctx.beginPath();
      ctx.moveTo(s * 0.2, -s * 0.08);
      ctx.lineTo(s * 0.42, -s * 0.2);
      ctx.moveTo(s * 0.2, s * 0.08);
      ctx.lineTo(s * 0.42, s * 0.2);
      ctx.stroke();
    }
  } else if (kind === 'sayur') {
    ctx.fillStyle = '#3f9e4d';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(i * s * 0.22, 0, s * 0.16, s * 0.34, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (chopped) {
      ctx.strokeStyle = '#2e7d3a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.1);
      ctx.lineTo(s * 0.3, s * 0.1);
      ctx.stroke();
    }
  } else if (kind === 'drink' || kind === 'teh') {
    ctx.fillStyle = '#c97b2e';
    rr(ctx, -s * 0.26, -s * 0.36, s * 0.52, s * 0.72, s * 0.08);
    ctx.fillStyle = '#f6f2e7';
    ctx.fillRect(-s * 0.26, -s * 0.36, s * 0.52, s * 0.12);
    ctx.fillStyle = '#8a4f1d';
    ctx.fillRect(-s * 0.18, -s * 0.2, s * 0.1, s * 0.1);
    ctx.fillRect(s * 0.06, -s * 0.05, s * 0.1, s * 0.1);
  }
  ctx.restore();
}

/** A finished dish on a plate, drawn at (x, y). */
export function drawDish(ctx, recipe, x, y, size) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.52, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8cfb8';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (recipe === 'nasi-goreng') {
    ctx.fillStyle = '#e08a3c';
    ctx.beginPath();
    ctx.arc(0, -s * 0.04, s * 0.3, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.arc(s * 0.1, -s * 0.16, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.beginPath();
    ctx.arc(s * 0.1, -s * 0.16, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f9e4d';
    ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.12, s * 0.06);
  } else if (recipe === 'mie-goreng') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = s * 0.1;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(0, i * s * 0.1 - s * 0.04, s * 0.22, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    ctx.fillStyle = '#3f9e4d';
    ctx.fillRect(-s * 0.26, -s * 0.2, s * 0.1, s * 0.06);
    ctx.fillRect(s * 0.16, -s * 0.14, s * 0.1, s * 0.06);
  }
  ctx.restore();
}

function drawFlame(ctx, x, y, size, now, intensity) {
  const flicker = 1 + Math.sin(now * 11 + x) * 0.12 + Math.sin(now * 23) * 0.06;
  const h = size * flicker * intensity;
  ctx.fillStyle = COLORS.flameLow;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, y);
  ctx.quadraticCurveTo(x - size * 0.3, y - h * 0.7, x, y - h);
  ctx.quadraticCurveTo(x + size * 0.3, y - h * 0.7, x + size * 0.5, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.flameHigh;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.28, y);
  ctx.quadraticCurveTo(x - size * 0.16, y - h * 0.5, x, y - h * 0.7);
  ctx.quadraticCurveTo(x + size * 0.16, y - h * 0.5, x + size * 0.28, y);
  ctx.closePath();
  ctx.fill();
}

function drawFace(ctx, customer, x, y, r) {
  ctx.fillStyle = customer.skin;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e1d0e';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.1, r * 0.09, 0, Math.PI * 2);
  ctx.arc(x + r * 0.35, y - r * 0.1, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e1d0e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y + r * 0.15, r * 0.35, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.fillStyle = customer.shirt;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.95, r * 0.55, 0, Math.PI);
  ctx.fill();
}

function drawOrderTicket(ctx, customer, x, y, w, h) {
  ctx.fillStyle = COLORS.hudPanel;
  rr(ctx, x, y, w, h, 8);
  ctx.strokeStyle = '#d8c49a';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawFace(ctx, customer, x + 26, y + 24, 15);
  text(ctx, customer.name, x + 46, y + 14, 13, COLORS.ink, 'left');
  let ix = x + 46;
  for (const wanted of customer.items) {
    if (wanted.kind === 'drink') {
      drawIngredient(ctx, 'drink', ix + 12, y + 36, 22, false);
    } else {
      drawDish(ctx, wanted.recipe, ix + 16, y + 36, 30);
    }
    if (wanted.served) {
      ctx.strokeStyle = COLORS.good;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ix + 2, y + 36);
      ctx.lineTo(ix + 10, y + 44);
      ctx.lineTo(ix + 26, y + 24);
      ctx.stroke();
    }
    ix += wanted.kind === 'drink' ? 30 : 44;
  }
  const fraction = Math.max(0, customer.patience / customer.maxPatience);
  const barColor = fraction > 0.5 ? COLORS.good : fraction > 0.25 ? COLORS.warn : COLORS.bad;
  ctx.fillStyle = '#e0d3b3';
  rr(ctx, x + 10, y + h - 14, w - 20, 8, 4);
  ctx.fillStyle = barColor;
  rr(ctx, x + 10, y + h - 14, (w - 20) * fraction, 8, 4);
}

function drawHud(ctx, kitchen) {
  const state = kitchen.state;
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 56);
  ctx.fillStyle = COLORS.awningRed;
  ctx.fillRect(0, 52, CANVAS_WIDTH, 4);
  text(ctx, 'WARUNG RUSH', 16, 28, 24, '#ffe9b0', 'left');
  text(ctx, `Rp ${state.score.toLocaleString('id-ID')}`, 250, 28, 20, '#ffffff', 'left');
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60);
  const timeText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const timeColor = state.timeLeft <= 30 ? '#ff6b5e' : '#ffffff';
  text(ctx, timeText, CANVAS_WIDTH / 2, 28, 28, timeColor);
  text(ctx, `Disajikan: ${state.served}`, CANVAS_WIDTH - 220, 20, 14, '#ffe9b0', 'left');
  if (state.combo >= 2) {
    ctx.fillStyle = '#e8a100';
    rr(ctx, CANVAS_WIDTH - 220, 32, 120, 20, 10);
    text(ctx, `COMBO x${state.combo}`, CANVAS_WIDTH - 160, 43, 14, '#2e1d0e');
  }
  // Rush meter: how deep into the dinner rush the game is.
  const level = kitchen.rushLevel();
  ctx.fillStyle = '#5a4026';
  rr(ctx, CANVAS_WIDTH - 84, 14, 68, 34, 6);
  ctx.fillStyle = '#ff9d00';
  rr(ctx, CANVAS_WIDTH - 80, 18, 60 * level, 26, 4);
  text(ctx, 'RUSH', CANVAS_WIDTH - 50, 31, 11, '#ffffff');
}

function drawOrderBoard(ctx, kitchen) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 56, CANVAS_WIDTH, 84);
  ctx.fillStyle = COLORS.wallDark;
  ctx.fillRect(0, 136, CANVAS_WIDTH, 4);
  text(ctx, 'PESANAN', 16, 98, 15, COLORS.ink, 'left');
  const customers = kitchen.orders.customers;
  if (customers.length === 0) {
    text(ctx, 'Belum ada pelanggan — sebentar lagi datang…', 120, 98, 14, '#7a5c33', 'left');
    return;
  }
  customers.forEach((customer, index) => {
    drawOrderTicket(ctx, customer, 120 + index * 208, 62, 196, 72);
  });
}

function drawBins(ctx) {
  for (const bin of STATIONS.bins) {
    ctx.fillStyle = COLORS.counterTop;
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 6);
    ctx.fillStyle = COLORS.counterFront;
    rr(ctx, bin.x, bin.y + bin.h - 18, bin.w, 18, 6);
    drawIngredient(ctx, bin.id, bin.x + bin.w / 2, bin.y + 22, 40, false);
    text(ctx, bin.label, bin.x + bin.w / 2, bin.y + bin.h - 9, 12, '#ffe9b0');
  }
}

function drawServeWindow(ctx, kitchen) {
  const rect = STATIONS.serve;
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 6);
  ctx.fillStyle = COLORS.counterFront;
  rr(ctx, rect.x, rect.y + rect.h - 18, rect.w, 18, 6);
  text(ctx, 'JENDELA SAJI', rect.x + rect.w / 2 - 30, rect.y + 22, 15, '#ffe9b0');
  // Service bell.
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(rect.x + rect.w - 40, rect.y + 22, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(rect.x + rect.w - 54, rect.y + 22, 28, 4);
  ctx.fillStyle = '#2e1d0e';
  ctx.beginPath();
  ctx.arc(rect.x + rect.w - 40, rect.y + 30, 3, 0, Math.PI * 2);
  ctx.fill();
  const waiting = kitchen.orders.waitingCount();
  text(ctx, waiting > 0 ? `${waiting} pelanggan menunggu` : 'Tidak ada antrean', rect.x + 16, rect.y + rect.h - 9, 12, '#ffe9b0', 'left');
}

function drawBoard(ctx, kitchen) {
  const rect = STATIONS.board;
  const board = kitchen.state.board;
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 6);
  ctx.fillStyle = COLORS.board;
  rr(ctx, rect.x + 14, rect.y + 12, rect.w - 28, rect.h - 24, 6);
  text(ctx, 'TALENAN', rect.x + rect.w / 2, rect.y + rect.h - 8, 11, '#ffe9b0');
  if (board.item) {
    drawIngredient(ctx, board.item.kind, rect.x + rect.w / 2 - 20, rect.y + rect.h / 2, 44, board.item.chopped);
    if (board.progress < CHOP_TIME) {
      ctx.fillStyle = '#e0d3b3';
      rr(ctx, rect.x + 24, rect.y + rect.h - 22, rect.w - 48, 8, 4);
      ctx.fillStyle = COLORS.good;
      rr(ctx, rect.x + 24, rect.y + rect.h - 22, (rect.w - 48) * (board.progress / CHOP_TIME), 8, 4);
    } else {
      text(ctx, 'Siap diambil', rect.x + rect.w / 2, rect.y + rect.h - 18, 11, COLORS.good);
    }
  } else {
    // Knife resting on the board.
    ctx.strokeStyle = '#cfd6dd';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w / 2 - 30, rect.y + rect.h / 2);
    ctx.lineTo(rect.x + rect.w / 2 + 20, rect.y + rect.h / 2 - 6);
    ctx.stroke();
    ctx.strokeStyle = '#4e2f14';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w / 2 + 20, rect.y + rect.h / 2 - 6);
    ctx.lineTo(rect.x + rect.w / 2 + 38, rect.y + rect.h / 2 - 10);
    ctx.stroke();
  }
}

function drawWok(ctx, kitchen, now) {
  const rect = STATIONS.wok;
  const wok = kitchen.state.wok;
  ctx.fillStyle = COLORS.steel;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fillStyle = '#3a3f45';
  rr(ctx, rect.x + 10, rect.y + 10, rect.w - 20, rect.h - 20, 6);
  // Flames under the wok while it cooks.
  if (wok.cooking) {
    drawFlame(ctx, rect.x + rect.w / 2 - 22, rect.y + rect.h - 12, 22, now, 0.7 + wok.flame * 0.5);
    drawFlame(ctx, rect.x + rect.w / 2 + 22, rect.y + rect.h - 12, 22, now + 0.7, 0.7 + wok.flame * 0.5);
  }
  // The wok bowl.
  ctx.fillStyle = COLORS.wok;
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2 - 4, 58, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d1d1d';
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2 - 6, 48, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  // What is inside the wok.
  if (wok.ready) {
    drawDish(ctx, wok.ready, rect.x + rect.w / 2, rect.y + rect.h / 2 - 4, 52);
  } else if (wok.items.length > 0) {
    wok.items.forEach((item, index) => {
      drawIngredient(ctx, item.kind, rect.x + rect.w / 2 - 24 + index * 24, rect.y + rect.h / 2 - 4, 30, item.chopped);
    });
  }
  text(ctx, 'WAJAN', rect.x + rect.w / 2, rect.y + rect.h - 8, 11, '#ffe9b0');
  // Cooking progress bar.
  if (wok.cooking) {
    ctx.fillStyle = '#e0d3b3';
    rr(ctx, rect.x + 10, rect.y - 16, rect.w - 20, 10, 5);
    ctx.fillStyle = '#ff9d00';
    rr(ctx, rect.x + 10, rect.y - 16, (rect.w - 20) * wok.progress, 10, 5);
  }
  // Flame meter: the toss window, with the green peak zone on top.
  const meterX = rect.x + rect.w + 8;
  const meterY = rect.y + 4;
  const meterH = rect.h - 8;
  ctx.fillStyle = '#e0d3b3';
  rr(ctx, meterX, meterY, 14, meterH, 7);
  ctx.fillStyle = COLORS.good;
  rr(ctx, meterX, meterY, 14, meterH * 0.15, 7);
  const markerY = meterY + meterH - wok.flame * meterH;
  ctx.fillStyle = '#ff5e3a';
  ctx.beginPath();
  ctx.arc(meterX + 7, markerY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e1d0e';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'API', meterX + 7, meterY + meterH + 12, 10, COLORS.ink);
}

function drawPlates(ctx, kitchen) {
  const rect = STATIONS.plates;
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 6);
  // A stack of clean plates.
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = COLORS.plate;
    ctx.beginPath();
    ctx.ellipse(rect.x + 46, rect.y + rect.h - 14 - i * 7, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8cfb8';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  text(ctx, 'PIRING', rect.x + 46, rect.y + 14, 11, '#ffe9b0');
  if (kitchen.state.plate.recipe) {
    drawDish(ctx, kitchen.state.plate.recipe, rect.x + rect.w - 56, rect.y + rect.h / 2 - 4, 56);
  }
}

function drawDrinks(ctx) {
  const rect = STATIONS.drinks;
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 6);
  // Dispenser with amber tea.
  ctx.fillStyle = '#cfd6dd';
  rr(ctx, rect.x + 16, rect.y + 8, 60, rect.h - 16, 6);
  ctx.fillStyle = '#c97b2e';
  rr(ctx, rect.x + 22, rect.y + 14, 48, rect.h - 28, 4);
  ctx.fillStyle = '#2e1d0e';
  ctx.fillRect(rect.x + 40, rect.y + rect.h - 14, 12, 8);
  drawIngredient(ctx, 'drink', rect.x + 120, rect.y + rect.h / 2, 40, false);
  text(ctx, 'ES TEH', rect.x + 120, rect.y + rect.h - 10, 11, '#ffe9b0');
}

function drawTrash(ctx) {
  const rect = STATIONS.trash;
  ctx.fillStyle = '#7a8288';
  rr(ctx, rect.x + 10, rect.y + 6, rect.w - 20, rect.h - 12, 6);
  ctx.fillStyle = '#5a6268';
  rr(ctx, rect.x + 6, rect.y + 2, rect.w - 12, 10, 5);
  text(ctx, 'SAMPAH', rect.x + rect.w / 2, rect.y + rect.h - 8, 10, '#ffe9b0');
}

function drawPlayer(ctx, kitchen, now) {
  const player = kitchen.state.player;
  const carry = kitchen.state.carry;
  ctx.fillStyle = 'rgba(46,29,14,0.25)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 14, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Apron body.
  ctx.fillStyle = '#3f7d5a';
  rr(ctx, player.x - 13, player.y - 6, 26, 22, 8);
  ctx.fillStyle = '#f6f2e7';
  rr(ctx, player.x - 10, player.y - 2, 20, 16, 5);
  // Head and chef hat.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 16, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(player.x - 7, player.y - 25, 7, 0, Math.PI * 2);
  ctx.arc(player.x + 7, player.y - 25, 7, 0, Math.PI * 2);
  ctx.arc(player.x, player.y - 28, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(player.x - 11, player.y - 26, 22, 5);
  // Eyes look where the cook faces.
  const look = player.facing === 'left' ? -3 : player.facing === 'right' ? 3 : 0;
  ctx.fillStyle = '#2e1d0e';
  ctx.beginPath();
  ctx.arc(player.x - 4 + look, player.y - 16, 1.6, 0, Math.PI * 2);
  ctx.arc(player.x + 4 + look, player.y - 16, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // What the cook carries, held up high.
  if (carry) {
    ctx.fillStyle = 'rgba(255,246,224,0.95)';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 48, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8c49a';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (carry.kind === 'dish' || carry.kind === 'plated') {
      drawDish(ctx, carry.recipe, player.x, player.y - 48, 28);
    } else if (carry.kind === 'drink') {
      drawIngredient(ctx, 'drink', player.x, player.y - 48, 26, false);
    } else {
      drawIngredient(ctx, carry.kind, player.x, player.y - 48, 26, carry.chopped);
    }
  }
}

function drawParticles(ctx, kitchen) {
  for (const particle of kitchen.state.particles) {
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, particle.life)})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const popup of kitchen.state.popups) {
    outlineText(ctx, popup.text, popup.x, popup.y, 18, popup.color);
  }
}

function drawPrompt(ctx, kitchen) {
  const prompt = kitchen.promptFor();
  const state = kitchen.state;
  if (state.message && state.elapsed < state.messageUntil) {
    ctx.fillStyle = 'rgba(46,29,14,0.85)';
    rr(ctx, CANVAS_WIDTH / 2 - 260, 556, 520, 28, 14);
    text(ctx, state.message, CANVAS_WIDTH / 2, 571, 14, '#ffe9b0');
  }
  ctx.fillStyle = 'rgba(46,29,14,0.8)';
  rr(ctx, CANVAS_WIDTH / 2 - 300, CANVAS_HEIGHT - 34, 600, 26, 13);
  const controls = 'WASD / Panah: gerak   •   E: ambil / taruh   •   Space: toss wajan   •   Klik: jalan & pakai';
  text(ctx, prompt ?? controls, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 21, 13, prompt ? '#ffe14d' : '#ffffff');
  const nearest = kitchen.nearestStation();
  if (nearest) {
    const rect = nearest.rect;
    ctx.strokeStyle = '#ffe14d';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    rrStroke(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 8);
    ctx.setLineDash([]);
  }
}

function drawKitchenFloor(ctx, now) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(0, 140, CANVAS_WIDTH, CANVAS_HEIGHT - 140);
  const tile = 48;
  for (let y = 140; y < CANVAS_HEIGHT; y += tile) {
    for (let x = 0; x < CANVAS_WIDTH; x += tile) {
      const even = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0;
      if (!even) {
        ctx.fillStyle = COLORS.floorB;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
}

/** Draw the whole game: HUD, order board, kitchen and the cook. */
export function drawGame(ctx, kitchen, now) {
  drawKitchenFloor(ctx, now);
  drawHud(ctx, kitchen);
  drawOrderBoard(ctx, kitchen);
  drawBins(ctx);
  drawServeWindow(ctx, kitchen);
  drawBoard(ctx, kitchen);
  drawWok(ctx, kitchen, now);
  drawPlates(ctx, kitchen);
  drawDrinks(ctx);
  drawTrash(ctx);
  drawParticles(ctx, kitchen);
  drawPlayer(ctx, kitchen, now);
  if (kitchen.state.screen === 'play' || kitchen.state.screen === 'playing') drawPrompt(ctx, kitchen);
}

function drawTitle(ctx, kitchen) {
  drawGame(ctx, kitchen, 0);
  ctx.fillStyle = 'rgba(46,29,14,0.72)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.hudPanel;
  rr(ctx, 130, 70, 700, 500, 16);
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'WARUNG RUSH', 480, 130, 56, COLORS.accent);
  text(ctx, 'Warung kaki lima paling sibuk di kota!', 480, 172, 18, COLORS.ink);
  text(ctx, 'Masak nasi goreng & mie goreng, tuang es teh, sajikan sebelum pelanggan kabur.', 480, 200, 15, '#7a5c33');
  // The menu.
  const menuItems = [
    { recipe: 'nasi-goreng', price: 'Rp 15.000' },
    { recipe: 'mie-goreng', price: 'Rp 13.000' },
    { recipe: null, price: 'Rp 5.000' },
  ];
  menuItems.forEach((item, index) => {
    const x = 240 + index * 160;
    ctx.fillStyle = '#f2e3c2';
    rr(ctx, x, 226, 140, 110, 10);
    if (item.recipe) {
      drawDish(ctx, item.recipe, x + 70, 268, 64);
      text(ctx, MENU[item.recipe].name, x + 70, 306, 14, COLORS.ink);
    } else {
      drawIngredient(ctx, 'drink', x + 70, 268, 52, false);
      text(ctx, 'Es Teh', x + 70, 306, 14, COLORS.ink);
    }
    text(ctx, item.price, x + 70, 326, 13, COLORS.accent);
  });
  text(ctx, 'Cara main:', 480, 366, 17, COLORS.ink, 'left');
  const steps = [
    '1. Ambil bahan dari rak, cincang telur / ayam / sayur di talenan.',
    '2. Masukkan bahan ke wajan — resep lengkap mulai memasak sendiri.',
    '3. Tekan SPACE saat api memuncak: PERFECT toss mempercepat masakan & combo naik.',
    '4. Tata di piring, sajikan di jendela sebelum kesabaran pelanggan habis.',
  ];
  steps.forEach((step, index) => {
    text(ctx, step, 190, 392 + index * 24, 14, COLORS.ink, 'left');
  });
  text(ctx, 'WASD / Panah bergerak  •  E ambil & taruh  •  Space toss  •  Klik jalan & pakai', 480, 502, 14, '#7a5c33');
  outlineText(ctx, 'Tekan ENTER atau klik untuk mulai', 480, 540, 20, '#ffe14d');
}

function drawGameOver(ctx, kitchen) {
  drawGame(ctx, kitchen, 0);
  ctx.fillStyle = 'rgba(46,29,14,0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const state = kitchen.state;
  ctx.fillStyle = COLORS.hudPanel;
  rr(ctx, 230, 90, 500, 460, 16);
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'WAKTU HABIS!', 480, 140, 40, COLORS.accent);
  text(ctx, 'Warung tutup — ini hasil rush malam ini:', 480, 176, 15, '#7a5c33');
  const stars = kitchen.stars();
  text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), 480, 214, 34, '#e8a100');
  const rows = [
    ['Uang masuk', `Rp ${state.score.toLocaleString('id-ID')}`],
    ['Pesanan disajikan', `${state.served} item • ${state.customersServed} pelanggan`],
    ['Combo terbaik', `x${state.bestCombo}`],
    ['Perfect toss', `${state.perfectTosses} dari ${state.totalTosses} toss`],
    ['Pelanggan kabur', `${state.lost} orang`],
  ];
  rows.forEach((row, index) => {
    const y = 258 + index * 36;
    text(ctx, row[0], 280, y, 16, COLORS.ink, 'left');
    text(ctx, row[1], 680, y, 16, COLORS.ink, 'right');
  });
  outlineText(ctx, 'Tekan R untuk main lagi', 480, 470, 20, '#ffe14d');
  text(ctx, 'Tips: toss saat api memuncak untuk combo, sajikan cepat untuk tip.', 480, 510, 13, '#7a5c33');
}

/** Draw the current screen of the game. */
export function drawScreen(ctx, kitchen, now) {
  if (kitchen.state.screen === 'title') drawTitle(ctx, kitchen);
  else if (kitchen.state.screen === 'over') drawGameOver(ctx, kitchen);
  else drawGame(ctx, kitchen, now);
}
