// Warung Rush — keyboard and mouse input. The game reads held keys every frame
// for movement and edge-triggered presses for actions, so a held E does not
// fire twice. A mouse click on the floor sets a walk target; a click on a
// station near the cook uses it, like pressing E.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
  let walkTarget = null;

  function keyName(event) {
    const key = event.key.toLowerCase();
    if (key === ' ') return 'space';
    return key;
  }

  function onKeyDown(event) {
    const name = keyName(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(name)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(name);
    keys.add(name);
  }

  function onKeyUp(event) {
    keys.delete(keyName(event));
  }

  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onMouseMove(event) {
    const point = toGameCoords(event);
    mouse.x = point.x;
    mouse.y = point.y;
  }

  function onMouseDown(event) {
    const point = toGameCoords(event);
    mouse.x = point.x;
    mouse.y = point.y;
    mouse.clicked = true;
    mouse.clickX = point.x;
    mouse.clickY = point.y;
    walkTarget = { x: point.x, y: point.y };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    /** True while any of the given keys is held. */
    held(...names) {
      return names.some((name) => keys.has(name));
    },

    /** True once for a key pressed since the last frame; consumes the press. */
    wasPressed(name) {
      if (!pressed.has(name)) return false;
      pressed.delete(name);
      return true;
    },

    /** The movement direction from WASD or the arrow keys, normalised. */
    moveDirection() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },

    /** The mouse position in canvas coordinates. */
    mousePosition() {
      return { x: mouse.x, y: mouse.y };
    },

    /** True once for a mouse click since the last frame; consumes it. */
    wasClicked() {
      if (!mouse.clicked) return false;
      mouse.clicked = false;
      return true;
    },

    clickPosition() {
      return { x: mouse.clickX, y: mouse.clickY };
    },

    /** The floor point the cook is walking toward, or null. */
    walkTarget() {
      return walkTarget;
    },

    clearWalkTarget() {
      walkTarget = null;
    },

    /** Forget every held key and pending press (used when the screen changes). */
    reset() {
      keys.clear();
      pressed.clear();
      walkTarget = null;
      mouse.clicked = false;
    },
  };
}
