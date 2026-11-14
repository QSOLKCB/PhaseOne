/* Copyright 2026 QSOL-IMC. Apache-2.0.
 * Browser-only pending input. The C99/WASM core owns authoritative state. */
export function createInputQueue() {
  const keys = new Set();
  let firePending = false;
  let yawPending = 0;
  let pitchPending = 0;
  const clamp = v => Math.max(-1500, Math.min(1500, v));
  return {
    press(code) { keys.add(code); },
    release(code) { keys.delete(code); },
    move(dx, dy) {
      yawPending = clamp(yawPending + dx * 3);
      pitchPending = clamp(pitchPending - dy * 3);
    },
    fire() { firePending = true; },
    clear() {
      keys.clear();
      firePending = false;
      yawPending = 0;
      pitchPending = 0;
    },
    consume() {
      let flags = 0;
      if(keys.has('KeyW') || keys.has('ArrowUp'))flags |= 1;
      if(keys.has('KeyS') || keys.has('ArrowDown'))flags |= 2;
      if(keys.has('KeyA'))flags |= 4;
      if(keys.has('KeyD'))flags |= 8;
      if(firePending)flags |= 16;
      firePending = false;
      const yaw=Math.max(-300,Math.min(300,Math.trunc(yawPending)));
      const pitch=Math.max(-300,Math.min(300,Math.trunc(pitchPending)));
      yawPending-=yaw;
      pitchPending-=pitch;
      return {flags,yaw,pitch};
    }
  };
}
/* Used by BOTH button and keyboard reset; clears pending inputs and tick backlog.
 * The pointer lock can stay active during the reset. */
export function resetSession(simulation, input, clock) {
  simulation.reset();
  input.clear();
  clock.prev = 0;
  clock.accumulator = 0;
}
