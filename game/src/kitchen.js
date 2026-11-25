// Warung Rush — the kitchen itself: the cook, the stations, the wok, the
// plates and the rush timer. This file owns the rules of play: what the cook
// can carry, what each station accepts, how a dish is cooked and served, and
// what it pays. Rendering lives in render.js; orders live in orders.js.

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CHOP_TIME,
  CHOPPABLE,
  COMBO_MAX,
  COMBO_STEP,
  COOK_TIME,
  DIFFICULTY,
  INTERACT_RADIUS,
  MENU,
  PLAYER,
  RUSH_SECONDS,
  STATIONS,
  TIP_AMOUNT,
  TIP_PATIENCE_ABOVE,
  TOSS_FLAME_SPEED,
  TOSS_PERFECT_ABOVE,
  TOSS_PROGRESS_BONUS,
} from './config.js';
import {
  sfxAngry,
  sfxChop,
  sfxChopDone,
  sfxDrop,
  sfxError,
  sfxGameOver,
  sfxNewOrder,
  sfxPickup,
  sfxServe,
  sfxSizzle,
  sfxTossMiss,
  sfxTossPerfect,
} from './audio.js';
import { createOrderManager } from './orders.js';

/** A carried thing: a raw or chopped ingredient, a cooked dish, a plated dish or a drink. */
export function carryLabel(carry) {
  if (!carry) return null;
  if (carry.kind === 'dish') return MENU[carry.recipe].name;
  if (carry.kind === 'plated') return `${MENU[carry.recipe].name} (piring)`;
  if (carry.kind === 'drink') return 'Es Teh';
  if (carry.chopped) return `${ingredientName(carry.kind)} cincang`;
  return ingredientName(carry.kind);
}

export function ingredientName(kind) {
  const names = {
    nasi: 'Nasi',
    mie: 'Mie',
    telur: 'Telur',
    ayam: 'Ayam',
    sayur: 'Sayur',
    teh: 'Teh',
  };
  return names[kind] ?? kind;
}

/** The colliders the cook cannot walk through: every station counter. */
function colliders() {
  const rects = [];
  for (const bin of STATIONS.bins) rects.push({ x: bin.x, y: bin.y, w: bin.w, h: bin.h });
  rects.push(STATIONS.serve, STATIONS.board, STATIONS.wok, STATIONS.plates, STATIONS.drinks, STATIONS.trash);
  return rects;
}

const COLLIDERS = colliders();

function clampToFloor(point) {
  return {
    x: Math.max(PLAYER.radius + 8, Math.min(CANVAS_WIDTH - PLAYER.radius - 8, point.x)),
    y: Math.max(212 + PLAYER.radius, Math.min(CANVAS_HEIGHT - PLAYER.radius - 8, point.y)),
  };
}

/** Push a circle out of a rectangle, returning the corrected position. */
function pushOutOfRect(pos, rect) {
  const nearestX = Math.max(rect.x, Math.min(pos.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(pos.y, rect.y + rect.h));
  const dx = pos.x - nearestX;
  const dy = pos.y - nearestY;
  const dist = Math.hypot(dx, dy);
  if (dist >= PLAYER.radius) return pos;
  if (dist === 0) return { x: pos.x, y: pos.y - PLAYER.radius };
  const push = PLAYER.radius - dist;
  return { x: pos.x + (dx / dist) * push, y: pos.y + (dy / dist) * push };
}

export function createKitchen(rng) {
  const orders = createOrderManager(rng);
  const state = {
    screen: 'title',
    timeLeft: RUSH_SECONDS,
    elapsed: 0,
    score: 0,
    served: 0,
    customersServed: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    perfectTosses: 0,
    totalTosses: 0,
    player: { x: PLAYER.startX, y: PLAYER.startY, facing: 'up' },
    carry: null,
    board: { item: null, progress: 0 },
    wok: { items: [], cooking: false, progress: 0, ready: null, phase: 0, flame: 0, tossCooldown: 0 },
    plate: { recipe: null },
    popups: [],
    particles: [],
    message: null,
    messageUntil: 0,
    sizzleTimer: 0,
    walkTarget: null,
    walkStation: null,
    walkStuck: 0,
  };

  function showMessage(text) {
    state.message = text;
    state.messageUntil = state.elapsed + 2.5;
  }

  function addPopup(x, y, text, color) {
    state.popups.push({ x, y, text, color, life: 1.4 });
  }

  function addSteam(x, y) {
    state.particles.push({ x, y, vy: -28, life: 0.9, size: 5 + Math.random() * 5 });
  }

  /** Distance from the cook to a station rectangle (0 when overlapping). */
  function distanceToStation(rect) {
    const nearestX = Math.max(rect.x, Math.min(state.player.x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(state.player.y, rect.y + rect.h));
    return Math.hypot(state.player.x - nearestX, state.player.y - nearestY);
  }

  /** The station the cook is close enough to use, or null. */
  function nearestStation() {
    let best = null;
    let bestDist = INTERACT_RADIUS;
    const check = (id, rect) => {
      const d = distanceToStation(rect);
      if (d < bestDist) {
        bestDist = d;
        best = { id, rect };
      }
    };
    for (const bin of STATIONS.bins) check(`bin:${bin.id}`, bin);
    check('serve', STATIONS.serve);
    check('board', STATIONS.board);
    check('wok', STATIONS.wok);
    check('plates', STATIONS.plates);
    check('drinks', STATIONS.drinks);
    check('trash', STATIONS.trash);
    return best;
  }

  function recipeFor(items) {
    for (const [recipe, menu] of Object.entries(MENU)) {
      if (menu.needs.length === 0) continue;
      if (items.length !== menu.needs.length) continue;
      const kinds = items.map((item) => item.kind);
      if (menu.needs.every((need) => kinds.includes(need))) return recipe;
    }
    return null;
  }

  function wokAccepts(item) {
    if (item.kind === 'dish' || item.kind === 'plated' || item.kind === 'drink') return false;
    if (CHOPPABLE.includes(item.kind) && !item.chopped) return false;
    for (const [recipe, menu] of Object.entries(MENU)) {
      if (menu.needs.length === 0) continue;
      const kinds = [...state.wok.items.map((held) => held.kind), item.kind];
      if (kinds.length > menu.needs.length) continue;
      if (kinds.every((kind) => menu.needs.includes(kind))) return true;
    }
    return false;
  }

  function useBin(binId) {
    if (state.carry) {
      showMessage('Tangan sudah penuh!');
      sfxError();
      return;
    }
    state.carry = { kind: binId, chopped: false };
    sfxPickup();
  }

  function useBoard() {
    const board = state.board;
    if (board.item && board.progress >= CHOP_TIME) {
      if (state.carry) {
        showMessage('Tangan sudah penuh!');
        sfxError();
        return;
      }
      state.carry = board.item;
      board.item = null;
      board.progress = 0;
      sfxPickup();
      return;
    }
    if (board.item) {
      showMessage('Masih dicincang… tahan E untuk lebih cepat');
      return;
    }
    if (!state.carry || !CHOPPABLE.includes(state.carry.kind) || state.carry.chopped) {
      showMessage('Taruh telur, ayam, atau sayur di talenan');
      sfxError();
      return;
    }
    board.item = state.carry;
    board.progress = 0;
    state.carry = null;
    sfxDrop();
  }

  function useWok() {
    const wok = state.wok;
    if (wok.ready) {
      if (state.carry) {
        showMessage('Tangan sudah penuh!');
        sfxError();
        return;
      }
      state.carry = { kind: 'dish', recipe: wok.ready };
      wok.ready = null;
      sfxPickup();
      return;
    }
    if (!state.carry) {
      showMessage(wok.cooking ? 'Wajan sedang memasak…' : 'Taruh bahan resep di wajan');
      return;
    }
    if (!wokAccepts(state.carry)) {
      showMessage('Bahan ini tidak cocok untuk resep di wajan');
      sfxError();
      return;
    }
    wok.items.push(state.carry);
    state.carry = null;
    sfxDrop();
    sfxSizzle();
    const recipe = recipeFor(wok.items);
    if (recipe) {
      wok.cooking = true;
      wok.progress = 0;
      showMessage(`Memasak ${MENU[recipe].name}… tekan Space saat api memuncak!`);
    }
  }

  function usePlates() {
    if (state.carry && state.carry.kind === 'dish') {
      if (state.plate.recipe) {
        showMessage('Piring sudah terisi!');
        sfxError();
        return;
      }
      state.plate.recipe = state.carry.recipe;
      state.carry = null;
      sfxDrop();
      return;
    }
    if (!state.carry && state.plate.recipe) {
      state.carry = { kind: 'plated', recipe: state.plate.recipe };
      state.plate.recipe = null;
      sfxPickup();
      return;
    }
    showMessage('Bawa masakan dari wajan ke piring');
    sfxError();
  }

  function useDrinks() {
    if (state.carry) {
      showMessage('Tangan sudah penuh!');
      sfxError();
      return;
    }
    state.carry = { kind: 'drink' };
    sfxPickup();
  }

  function useServe() {
    const carry = state.carry;
    if (!carry || (carry.kind !== 'plated' && carry.kind !== 'drink')) {
      showMessage('Bawa piring atau es teh ke jendela saji');
      sfxError();
      return;
    }
    const item = carry.kind === 'drink' ? { kind: 'drink' } : { kind: 'dish', recipe: carry.recipe };
    if (!orders.matchesAny(item)) {
      showMessage('Tidak ada yang pesan ini!');
      sfxError();
      return;
    }
    const price = orders.priceOf(item);
    const multiplier = 1 + COMBO_STEP * state.combo;
    let earned = Math.round(price * multiplier);
    const completed = orders.serve(item);
    let tip = 0;
    state.served += 1;
    if (completed) {
      const patienceLeft = completed.patience / completed.maxPatience;
      if (patienceLeft > TIP_PATIENCE_ABOVE) tip = TIP_AMOUNT;
      earned += tip;
      state.customersServed += 1;
    }
    state.score += earned;
    state.carry = null;
    sfxServe();
    addPopup(STATIONS.serve.standX, STATIONS.serve.y + 30, `+Rp ${earned.toLocaleString('id-ID')}`, '#2e9e4f');
    if (tip > 0) addPopup(STATIONS.serve.standX, STATIONS.serve.y + 54, `Tip +Rp ${tip.toLocaleString('id-ID')}`, '#e8a100');
    if (completed) addPopup(STATIONS.serve.standX, STATIONS.serve.y + 78, `${completed.name} senang!`, '#2e5f8a');
  }

  function useTrash() {
    if (!state.carry) {
      showMessage('Tidak ada yang dibuang');
      return;
    }
    state.carry = null;
    sfxDrop();
    showMessage('Dibuang');
  }

  function interact(stationId) {
    if (stationId.startsWith('bin:')) {
      useBin(stationId.slice(4));
      return;
    }
    if (stationId === 'board') useBoard();
    else if (stationId === 'wok') useWok();
    else if (stationId === 'plates') usePlates();
    else if (stationId === 'drinks') useDrinks();
    else if (stationId === 'serve') useServe();
    else if (stationId === 'trash') useTrash();
  }

  function tossWok() {
    const wok = state.wok;
    if (!wok.cooking) return;
    if (wok.tossCooldown > 0) return;
    wok.tossCooldown = 0.6;
    state.totalTosses += 1;
    if (wok.flame >= TOSS_PERFECT_ABOVE) {
      wok.progress = Math.min(1, wok.progress + TOSS_PROGRESS_BONUS);
      state.combo = Math.min(COMBO_MAX, state.combo + 1);
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.perfectTosses += 1;
      sfxTossPerfect();
      addPopup(STATIONS.wok.x + STATIONS.wok.w / 2, STATIONS.wok.y - 14, 'PERFECT!', '#e8a100');
    } else {
      state.combo = 0;
      sfxTossMiss();
      addPopup(STATIONS.wok.x + STATIONS.wok.w / 2, STATIONS.wok.y - 14, 'Miss…', '#d23b2e');
    }
  }

  function movePlayer(dt, input) {
    const dir = input.moveDirection();
    let target = null;
    if (dir.x !== 0 || dir.y !== 0) {
      state.walkTarget = null;
      state.walkStation = null;
      target = dir;
    } else if (state.walkTarget) {
      const dx = state.walkTarget.x - state.player.x;
      const dy = state.walkTarget.y - state.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        if (state.walkStation) {
          const station = state.walkStation;
          state.walkStation = null;
          state.walkTarget = null;
          interact(station);
        } else {
          state.walkTarget = null;
        }
        return;
      }
      target = { x: dx / dist, y: dy / dist };
    }
    if (!target) return;
    const before = { x: state.player.x, y: state.player.y };
    let next = {
      x: state.player.x + target.x * PLAYER.speed * dt,
      y: state.player.y + target.y * PLAYER.speed * dt,
    };
    next = clampToFloor(next);
    for (const rect of COLLIDERS) next = pushOutOfRect(next, rect);
    state.player.x = next.x;
    state.player.y = next.y;
    if (Math.abs(target.y) > Math.abs(target.x)) state.player.facing = target.y < 0 ? 'up' : 'down';
    else state.player.facing = target.x < 0 ? 'left' : 'right';
    if (state.walkTarget) {
      const moved = Math.hypot(next.x - before.x, next.y - before.y);
      if (moved < PLAYER.speed * dt * 0.25) {
        state.walkStuck += dt;
        if (state.walkStuck > 0.6) {
          state.walkTarget = null;
          state.walkStation = null;
          state.walkStuck = 0;
        }
      } else {
        state.walkStuck = 0;
      }
    }
  }

  /** The action the nearest station offers, for the on-screen prompt. */
  function promptFor() {
    const station = nearestStation();
    if (!station) return null;
    const carry = state.carry;
    if (station.id.startsWith('bin:')) {
      return carry ? null : `E — Ambil ${ingredientName(station.id.slice(4))}`;
    }
    if (station.id === 'board') {
      if (state.board.item && state.board.progress >= CHOP_TIME) return 'E — Ambil cincangan';
      if (state.board.item) return 'E — Cincang lebih cepat';
      if (carry && CHOPPABLE.includes(carry.kind) && !carry.chopped) return 'E — Taruh di talenan';
      return 'Talenan: butuh telur / ayam / sayur';
    }
    if (station.id === 'wok') {
      if (state.wok.ready) return carry ? null : 'E — Angkat masakan';
      if (state.wok.cooking) return 'Space — Toss saat api memuncak!';
      if (carry && wokAccepts(carry)) return 'E — Masukkan ke wajan';
      return 'Wajan: butuh bahan resep';
    }
    if (station.id === 'plates') {
      if (carry && carry.kind === 'dish') return 'E — Tata di piring';
      if (!carry && state.plate.recipe) return 'E — Ambil piring';
      return null;
    }
    if (station.id === 'drinks') return carry ? null : 'E — Tuang Es Teh';
    if (station.id === 'serve') {
      if (carry && (carry.kind === 'plated' || carry.kind === 'drink')) return 'E — Sajikan!';
      return null;
    }
    if (station.id === 'trash') return carry ? 'E — Buang' : null;
    return null;
  }

  return {
    state,
    orders,

    /** Start a fresh rush from the title screen. */
    start() {
      state.screen = 'playing';
      state.timeLeft = RUSH_SECONDS;
      state.elapsed = 0;
      state.score = 0;
      state.served = 0;
      state.customersServed = 0;
      state.lost = 0;
      state.combo = 0;
      state.bestCombo = 0;
      state.perfectTosses = 0;
      state.totalTosses = 0;
      state.carry = null;
      state.board = { item: null, progress: 0 };
      state.wok = { items: [], cooking: false, progress: 0, ready: null, phase: 0, flame: 0, tossCooldown: 0 };
      state.plate = { recipe: null };
      state.popups = [];
      state.particles = [];
      state.player = { x: PLAYER.startX, y: PLAYER.startY, facing: 'up' };
      orders.customers.length = 0;
      showMessage('Rush dimulai! Ambil pesanan pertama.');
    },

    /** One fixed step of the game. `input` is the input object, or a scripted stand-in. */
    update(dt, input) {
      if (state.screen !== 'playing') return;
      state.elapsed += dt;
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        state.screen = 'over';
        sfxGameOver();
        return;
      }

      orders.update(
        dt,
        () => sfxNewOrder(),
        () => {
          state.lost += 1;
          state.combo = 0;
          sfxAngry();
          showMessage('Pelanggan pergi karena menunggu terlalu lama!');
        },
      );

      // Chopping: automatic while an item is on the board; holding E near it doubles the speed.
      const board = state.board;
      if (board.item && board.progress < CHOP_TIME) {
        const near = nearestStation();
        const fast = near && near.id === 'board' && input.held && input.held('e');
        board.progress += (dt / CHOP_TIME) * (fast ? 2 : 1);
        if (board.progress >= CHOP_TIME) {
          board.progress = CHOP_TIME;
          board.item.chopped = true;
          sfxChopDone();
        }
      }

      // The wok flame rises and falls; cooking advances while it burns.
      const wok = state.wok;
      wok.phase += dt * TOSS_FLAME_SPEED;
      wok.flame = (Math.sin(wok.phase) + 1) / 2;
      if (wok.tossCooldown > 0) wok.tossCooldown -= dt;
      if (wok.cooking) {
        wok.progress += dt / COOK_TIME;
        state.sizzleTimer -= dt;
        if (state.sizzleTimer <= 0) {
          state.sizzleTimer = 0.5;
          addSteam(wok.x + wok.w / 2 + (Math.random() - 0.5) * 40, wok.y + 10);
        }
        if (wok.progress >= 1) {
          wok.progress = 1;
          wok.cooking = false;
          wok.ready = recipeFor(wok.items);
          wok.items = [];
          sfxChopDone();
          showMessage('Masakan matang! Angkat dari wajan, lalu tata di piring.');
        }
      }

      // Popups rise and fade; steam drifts up.
      for (let i = state.popups.length - 1; i >= 0; i -= 1) {
        const popup = state.popups[i];
        popup.life -= dt;
        popup.y -= 24 * dt;
        if (popup.life <= 0) state.popups.splice(i, 1);
      }
      for (let i = state.particles.length - 1; i >= 0; i -= 1) {
        const particle = state.particles[i];
        particle.life -= dt;
        particle.y += particle.vy * dt;
        if (particle.life <= 0) state.particles.splice(i, 1);
      }

      movePlayer(dt, input);

      // Actions.
      if (input.wasPressed && input.wasPressed('e')) {
        const station = nearestStation();
        if (station) interact(station.id);
      }
      if (input.wasPressed && input.wasPressed('space')) tossWok();
      if (input.wasClicked && input.wasClicked()) {
        const point = input.clickPosition();
        const station = nearestStation();
        if (station && distanceToStation(station.rect) < INTERACT_RADIUS) {
          interact(station.id);
        } else {
          state.walkTarget = { x: point.x, y: point.y };
          state.walkStation = null;
          // A click on a station from afar walks the cook there and uses it on arrival.
          let best = null;
          let bestDist = 60;
          const consider = (id, rect) => {
            const cx = Math.max(rect.x, Math.min(point.x, rect.x + rect.w));
            const cy = Math.max(rect.y, Math.min(point.y, rect.y + rect.h));
            const d = Math.hypot(point.x - cx, point.y - cy);
            if (d < bestDist) {
              bestDist = d;
              best = { id, rect };
            }
          };
          for (const bin of STATIONS.bins) consider(`bin:${bin.id}`, bin);
          consider('serve', STATIONS.serve);
          consider('board', STATIONS.board);
          consider('wok', STATIONS.wok);
          consider('plates', STATIONS.plates);
          consider('drinks', STATIONS.drinks);
          consider('trash', STATIONS.trash);
          if (best) {
            state.walkTarget = { x: best.rect.standX, y: best.rect.standY };
            state.walkStation = best.id;
          }
        }
      }
    },

    interact,
    tossWok,
    nearestStation,
    promptFor,
    carryLabel,

    /** Stars for the game-over summary: 1 for a decent rush, 3 for a great one. */
    stars() {
      if (state.served >= 14) return 3;
      if (state.served >= 10) return 2;
      if (state.served >= 6) return 1;
      return 0;
    },

    /** Difficulty now, for the renderer's rush meter. */
    rushLevel() {
      return Math.min(1, state.elapsed / DIFFICULTY.spawnRampAt);
    },
  };
}
