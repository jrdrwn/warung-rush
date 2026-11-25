// Warung Rush — configuration: canvas, kitchen layout, menu, recipes, timings.
// Every number that tunes the game lives here so the other files stay about rules,
// not about constants.

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

export const RUSH_SECONDS = 180;
export const MAX_CUSTOMERS = 4;

// The dinner rush, in seconds of play.
export const DIFFICULTY = {
  firstOrderAt: 2,
  spawnEveryStart: 14,
  spawnEveryEnd: 7,
  spawnRampAt: 150,
  patienceStart: 50,
  patienceEnd: 32,
  doubleOrderChanceStart: 0.25,
  doubleOrderChanceEnd: 0.45,
  doubleOrderRampAt: 90,
};

// Player movement.
export const PLAYER = {
  radius: 16,
  speed: 230,
  startX: 480,
  startY: 540,
};

// Kitchen stations: rectangles the cook walks up to, and the spot in open floor
// the cook stands on while using each one.
export const STATIONS = {
  // Ingredient bins along the top counter, left to right.
  bins: [
    { id: 'nasi', label: 'Nasi', x: 16, y: 150, w: 88, h: 62, standX: 60, standY: 240 },
    { id: 'mie', label: 'Mie', x: 112, y: 150, w: 88, h: 62, standX: 156, standY: 240 },
    { id: 'telur', label: 'Telur', x: 208, y: 150, w: 88, h: 62, standX: 252, standY: 240 },
    { id: 'ayam', label: 'Ayam', x: 304, y: 150, w: 88, h: 62, standX: 348, standY: 240 },
    { id: 'sayur', label: 'Sayur', x: 400, y: 150, w: 88, h: 62, standX: 444, standY: 240 },
  ],
  // Serving window, top right.
  serve: { x: 520, y: 150, w: 424, h: 62, standX: 732, standY: 240 },
  // Chopping board, mid-left.
  board: { x: 60, y: 300, w: 180, h: 64, standX: 150, standY: 392 },
  // Wok stove, centre.
  wok: { x: 400, y: 280, w: 160, h: 84, standX: 480, standY: 392 },
  // Plate stack, mid-right.
  plates: { x: 700, y: 300, w: 180, h: 64, standX: 790, standY: 392 },
  // Es teh dispenser, bottom right.
  drinks: { x: 700, y: 460, w: 180, h: 56, standX: 790, standY: 440 },
  // Rubbish bin, bottom left.
  trash: { x: 60, y: 460, w: 80, h: 56, standX: 110, standY: 440 },
};

// How close the cook must be to a station to use it.
export const INTERACT_RADIUS = 46;

// What can be chopped, and how long a chop takes.
export const CHOP_TIME = 1.4;
export const CHOPPABLE = ['telur', 'ayam', 'sayur'];

// The wok: how long a full recipe takes to cook, and the toss window.
export const COOK_TIME = 7;
export const TOSS_PERFECT_ABOVE = 0.85;
export const TOSS_PROGRESS_BONUS = 0.22;
export const TOSS_FLAME_SPEED = 2.1;

// The menu: what a customer can order, what it pays, and what it is made of.
export const MENU = {
  'nasi-goreng': {
    name: 'Nasi Goreng',
    price: 15000,
    needs: ['nasi', 'telur', 'ayam'],
    short: 'NasGor',
  },
  'mie-goreng': {
    name: 'Mie Goreng',
    price: 13000,
    needs: ['mie', 'telur', 'sayur'],
    short: 'MieGor',
  },
  'es-teh': {
    name: 'Es Teh',
    price: 5000,
    needs: [],
    short: 'EsTeh',
  },
};

// A cooked dish is worth its price; a fast serve earns a tip, and a perfect
// toss streak multiplies the dish price.
export const TIP_AMOUNT = 2000;
export const TIP_PATIENCE_ABOVE = 0.6;
export const COMBO_STEP = 0.1;
export const COMBO_MAX = 5;

// Colours for the warung: warm wood, terracotta, cream and a green awning.
export const COLORS = {
  wall: '#f2d8a7',
  wallDark: '#e0b978',
  floorA: '#c98f4e',
  floorB: '#b57e42',
  counterTop: '#8a5a2b',
  counterFront: '#6e4520',
  counterEdge: '#4e2f14',
  board: '#d9a05b',
  steel: '#9aa3ad',
  wok: '#2b2b2b',
  flameLow: '#ff9d00',
  flameHigh: '#ffe14d',
  plate: '#f6f2e7',
  hud: '#2e1d0e',
  hudPanel: '#fff6e0',
  ink: '#2e1d0e',
  good: '#2e9e4f',
  warn: '#e8a100',
  bad: '#d23b2e',
  accent: '#c0392b',
  awningRed: '#c0392b',
  awningCream: '#fff6e0',
};

// Names the regulars are called by on their tickets.
export const CUSTOMER_NAMES = ['Pak Budi', 'Bu Sari', 'Mas Agus', 'Mbak Rina', 'Bang Joko', 'Bu Dewi', 'Kak Putri', 'Om Slamet'];

// Face colours for the ticket portraits.
export const CUSTOMER_SKINS = ['#f2c89b', '#e8b07d', '#d99a63', '#f6d7a8'];
export const CUSTOMER_SHIRTS = ['#3f7d5a', '#c0392b', '#2e5f8a', '#8a5fb0', '#d97b29', '#4a7d8c'];
