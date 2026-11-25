// Warung Rush — the screenshot scenes behind ?shot=early|mid|rush.
// Each one plays the real rules forward from a fresh world for a fixed number
// of steps, steered by a scripted cook that walks to stations, chops, cooks,
// tosses the wok and serves — so the frame is what a real game looks like and
// the same seed always gives the same frame. No state is faked: the autopilot
// only walks the cook and presses the game's own buttons.
//
// The cook never steers diagonally through the kitchen: it moves along safe
// lanes — the top corridor between the bins and the mid counters, the middle
// lane below them, and the bottom lane — and changes lanes only in the two
// open gaps between the counters, so it never gets stuck on a corner.

import { INTERACT_RADIUS, MENU, STATIONS, TOSS_PERFECT_ABOVE } from './config.js';
import { CHOPPABLE } from './config.js';
import { SCREEN_PLAY } from './render.js';

const STEP = 1 / 60;
// The two open gaps between the mid counters, where the cook changes lanes.
const GAP_COLUMNS = [320, 630];
// The safe rows the cook travels along.
const TOP_LANE = 240;
const MID_LANE = 392;

/** An input stand-in that presses nothing; the autopilot steers by walking. */
const nullInput = {
  held: () => false,
  wasPressed: () => false,
  wasClicked: () => false,
  moveDirection: () => ({ x: 0, y: 0 }),
  clickPosition: () => ({ x: 0, y: 0 }),
};

/** The stand point and station id for a station. */
function standFor(stationId, binId) {
  if (stationId === 'bin') {
    const bin = STATIONS.bins.find((item) => item.id === binId);
    return { x: bin.standX, y: bin.standY, id: `bin:${binId}` };
  }
  const rect = STATIONS[stationId];
  return { x: rect.standX, y: rect.standY, id: stationId };
}

/**
 * The lane waypoints from `from` to a station's stand point: along the
 * current lane to a gap column, up or down the gap to the target's lane,
 * then along that lane to the stand point. Every leg is axis-aligned inside
 * a lane or a gap, so the walk never meets a counter.
 */
function routeTo(from, stand) {
  const waypoints = [];
  const targetLane = stand.y <= 280 ? TOP_LANE : MID_LANE;
  const nearGap = Math.abs(from.x - GAP_COLUMNS[0]) <= Math.abs(from.x - GAP_COLUMNS[1]) ? GAP_COLUMNS[0] : GAP_COLUMNS[1];
  const fromLane = from.y <= 280 ? TOP_LANE : from.y <= 460 ? MID_LANE : 540;
  if (fromLane !== targetLane) {
    if (Math.abs(from.x - nearGap) > 4) waypoints.push({ x: nearGap, y: from.y });
    waypoints.push({ x: nearGap, y: targetLane });
  }
  if (Math.abs((waypoints[waypoints.length - 1]?.x ?? from.x) - stand.x) > 4 || waypoints.length === 0) {
    waypoints.push({ x: stand.x, y: targetLane });
  }
  if (stand.y !== targetLane) waypoints.push({ x: stand.x, y: stand.y });
  return waypoints;
}

/** A scripted cook: one step at a time, each step walks somewhere and waits for a condition. */
function createPilot(kitchen) {
  const state = kitchen.state;
  let plan = [];
  let stepIndex = 0;
  let stepTimer = 0;
  let waypoints = [];
  let waypointRetries = 0;

  function currentStep() {
    return plan[stepIndex] ?? null;
  }

  function carryingIsWanted() {
    const carry = state.carry;
    if (!carry) return true;
    if (carry.kind === 'dish' || carry.kind === 'plated') {
      return kitchen.orders.matchesAny({ kind: 'dish', recipe: carry.recipe });
    }
    if (carry.kind === 'drink') return kitchen.orders.matchesAny({ kind: 'drink' });
    return true;
  }

  function buildPlan() {
    const customers = kitchen.orders.customers;
    if (customers.length === 0) return [];
    const customer = customers[0];
    const wanted = customer.items.find((item) => !item.served);
    if (!wanted) return [];
    const steps = [];
    if (wanted.kind === 'drink') {
      steps.push({ go: standFor('drinks'), until: () => state.carry && state.carry.kind === 'drink' });
    } else {
      const needs = MENU[wanted.recipe].needs;
      for (const need of needs) {
        steps.push({ go: standFor('bin', need), until: () => state.carry && state.carry.kind === need && !state.carry.chopped });
        if (CHOPPABLE.includes(need)) {
          steps.push({ go: standFor('board'), until: () => state.board.item && state.board.item.kind === need });
          steps.push({ wait: () => state.board.item && state.board.item.chopped });
          steps.push({ go: standFor('board'), until: () => state.carry && state.carry.kind === need && state.carry.chopped });
        }
        steps.push({ go: standFor('wok'), until: () => !state.carry });
      }
      steps.push({ wait: () => state.wok.ready !== null, toss: true });
      steps.push({ go: standFor('wok'), until: () => state.carry && state.carry.kind === 'dish' });
      steps.push({ go: standFor('plates'), until: () => state.plate.recipe !== null });
      steps.push({ go: standFor('plates'), until: () => state.carry && state.carry.kind === 'plated' });
    }
    steps.push({ go: standFor('serve'), until: () => !state.carry });
    return steps;
  }

  /** Start walking the current step's route, one waypoint at a time. */
  function steerTo(step) {
    // Close to the stand point: walk straight to it and use the station. The
    // stand points sit in open floor, so the last few pixels are always clear.
    const standDist = Math.hypot(state.player.x - step.go.x, state.player.y - step.go.y);
    if (standDist < INTERACT_RADIUS) {
      waypoints = [];
      if (!state.walkTarget) {
        state.walkTarget = { x: step.go.x, y: step.go.y };
        state.walkStation = step.go.id;
      }
      return;
    }
    if (waypoints.length === 0) {
      waypoints = routeTo(state.player, step.go);
      waypointRetries = 0;
    }
    if (state.walkTarget) return;
    const next = waypoints[0];
    if (!next) return;
    const dist = Math.hypot(state.player.x - next.x, state.player.y - next.y);
    if (dist < 10) {
      waypoints.shift();
      waypointRetries = 0;
      return;
    }
    if (waypointRetries < 3) {
      waypointRetries += 1;
      state.walkTarget = { x: next.x, y: next.y };
      state.walkStation = null;
    } else {
      waypoints.shift();
      waypointRetries = 0;
    }
  }

  return {
    /** One autopilot tick: steer the cook toward the current step's goal. */
    tick(dt) {
      const step = currentStep();
      if (!step) {
        waypoints = [];
        if (!carryingIsWanted() && state.carry) {
          plan = [{ go: standFor('trash'), until: () => !state.carry }];
          stepIndex = 0;
          stepTimer = 0;
          return;
        }
        plan = buildPlan();
        stepIndex = 0;
        stepTimer = 0;
        return;
      }
      stepTimer += dt;
      if (stepTimer > 30) {
        // A step that never completes (a lost order, a blocked walk): drop the plan and re-plan.
        plan = [];
        stepIndex = 0;
        stepTimer = 0;
        waypoints = [];
        state.walkTarget = null;
        state.walkStation = null;
        return;
      }
      if (step.toss && state.wok.cooking && state.wok.flame >= TOSS_PERFECT_ABOVE) {
        kitchen.tossWok();
      }
      if (step.wait) {
        if (step.wait()) {
          stepIndex += 1;
          stepTimer = 0;
        }
        return;
      }
      if (step.until()) {
        stepIndex += 1;
        stepTimer = 0;
        waypoints = [];
        return;
      }
      if (step.go) steerTo(step);
    },
  };
}

/** Run the game forward for `seconds` with the autopilot steering. */
function playForward(kitchen, seconds) {
  const pilot = createPilot(kitchen);
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    pilot.tick(STEP);
    kitchen.update(STEP, nullInput);
    if (kitchen.state.screen !== 'playing') break;
  }
}

/**
 * Set the kitchen to the named scene (early, mid or rush; any other name is
 * early) and return the screen to draw over it.
 */
export function stageShot(name, kitchen) {
  kitchen.start();
  if (name === 'cook') {
    // Play until a dish is mid-cook in the wok (flames up, progress part-way), or 90s.
    const pilot = createPilot(kitchen);
    let played = 0;
    while (played < 90) {
      pilot.tick(STEP);
      kitchen.update(STEP, nullInput);
      played += STEP;
      if (kitchen.state.screen !== 'playing') break;
      if (kitchen.state.wok.cooking && kitchen.state.wok.progress >= 0.35) break;
    }
    return { screen: SCREEN_PLAY };
  }
  if (name === 'mid') {
    // Play until a plate is ready to serve with a second dish on its way, or 100s.
    const pilot = createPilot(kitchen);
    let played = 0;
    while (played < 100) {
      pilot.tick(STEP);
      kitchen.update(STEP, nullInput);
      played += STEP;
      if (kitchen.state.screen !== 'playing') break;
      if (kitchen.state.plate.recipe !== null && kitchen.orders.waitingCount() >= 2) break;
    }
    return { screen: SCREEN_PLAY };
  }
  if (name === 'rush') {
    playForward(kitchen, 140);
    return { screen: SCREEN_PLAY };
  }
  playForward(kitchen, 8);
  return { screen: SCREEN_PLAY };
}
