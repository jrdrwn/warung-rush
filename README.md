# warung-rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/jrdrwn/warung-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/jrdrwn/warung-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Warung Rush — an original Indonesian street-food stall game for the make.fun "Make the best cooking game" bounty. Run a small warung through a 3-minute dinner rush: take orders, fetch ingredients, chop, cook in the wok, and serve before your customers lose patience.

## The hook: the timed wok toss

While a dish cooks, the flame under the wok rises and falls. Press **Space** exactly when the flame peaks and the toss lands PERFECT: the dish cooks faster and your combo climbs, multiplying what every dish pays. Miss, and the combo resets.

## Menu

- **Nasi Goreng** — Rp 15.000 (nasi + telur cincang + ayam cincang, wajan)
- **Mie Goreng** — Rp 13.000 (mie + telur cincang + sayur cincang, wajan)
- **Es Teh** — Rp 5.000 (tuang di dispenser, langsung saji)

Serve fast and a happy customer leaves a Rp 2.000 tip. Later orders ask for a dish plus a drink, customers arrive faster, and their patience shrinks.

## Controls

- **WASD / arrow keys** — move the cook (or click the floor to walk there)
- **E** (or click a nearby station) — pick up / put down / use
- **Space** — wok toss, timed to the flame
- **M** — mute, **R** — restart after the rush ends

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

`game/` is plain static files: open `game/index.html` from any static server and it plays with no network request. All art is drawn in code; all sounds are made with the Web Audio API.

## Layout

- `game/index.html` — the page and canvas
- `game/src/config.js` — menu, recipes, timings, kitchen layout, colours
- `game/src/random.js` — seeded random generator
- `game/src/audio.js` — Web Audio sound effects, no audio files
- `game/src/input.js` — keyboard and mouse input
- `game/src/orders.js` — customers, orders and patience
- `game/src/kitchen.js` — the rules: carrying, chopping, the wok, serving, score
- `game/src/shots.js` — the autopilot that stages the screenshot scenes
- `game/src/render.js` — all canvas drawing
- `game/src/main.js` — the loop and the screens
- `main.ts` — the hand-in program (Node 22): copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
