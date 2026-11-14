# PhaseOne architecture: native simulation, browser presentation

This is the **proposed** PHASEONE-001 architecture. Paths, symbols, and protocols below are design targets, **not existing implementation**.

## Contract

The same C99 game-simulation implementation must be compiled into two targets:

1. A **native Linux headless executable** used for deterministic test traces and reference state output.
2. A **browser WebAssembly module** whose simulation is invoked by a small JavaScript host; WebGL 2 performs rendering.

The browser consumes snapshots from the simulation. It does not become a second, independently implemented simulation.

```text
                  canonical normalized tick input
                                |
                        C99 simulation core
                        |       |        |
                    movement collision target/hit
                        |       |        |
                   explicit serialized state
                        |
                +-------+---------+
                |                 |
          native runner     WASM exported ABI
                |                 |
        reference replay    browser host JS
        trace + hash        pointer lock / keys
                                  |
                           render snapshot
                                  |
                            WebGL 2 renderer
```

## Responsibility boundaries

| Component | Owns | Must not own |
| --- | --- | --- |
| C99 simulation | Fixed-step state transitions; player pose; collision; target state; scoring; seeded RNG if needed | DOM, timers, network, filesystem, browser graphics |
| Native headless runner | File/CLI trace input, stepping, state serialization, logs and exit codes | Forked or reimplemented game rules |
| WASM module / ABI | Exposing initialization, step, input, snapshot extraction, and state serialization | Uncontrolled browser global state |
| JavaScript browser host | WASM loading, resize/input/pointer lock, tick scheduling, audio unlock, render invocation | Independent gameplay/collision algorithm |
| WebGL 2 renderer | Basic geometry, camera transforms, target visuals, HUD presentation | Authoritative gameplay state |

Audio is optional for PHASEONE-001; future audio must route through Web Audio and user-gesture unlocking. No WebGPU requirement in the first gate.

## Proposed repository layout

```text
src/core/            pure portable C99 simulation, headers, state serializer
src/native/          headless C99 CLI and trace driver
src/web/             minimal HTML, JavaScript WASM host, WebGL 2 renderer
assets/              original/procedural only; add provenance records
tests/traces/        canonical input traces and expected reference outputs
scripts/             pinned build/test/evidence commands
docs/                architecture and executed evidence guidance
dist/                generated static build, not manually authored
```

The exact layout may evolve in an implementation PR with documented rationale.

## Simulation design

- **Fixed timestep:** one step represents 1/60 second; the implementation must define rounding if integer distances/velocities are used.
- **Normalized input:** explicit tick-indexed commands, e.g. move-forward, move-strafe, yaw/pitch delta, fire, and interact. The browser normalizes key/mouse events into per-tick input before calling WASM.
- **No host-time dependency:** wall time is only for scheduling and diagnostics; it cannot alter the outcome of a given trace.
- **No implicit randomness:** if randomness is introduced, seed and generator algorithm become part of the input/schema. PHASEONE-001 can omit RNG entirely.
- **Collision and target hits:** choose an inspectable representation (e.g. axis-aligned room bounds and target volumes), document tie-breaking and thresholds.
- **State representation:** define authoritative integer/fixed-point fields and ranges. Rendering matrices and interpolation may be floating point but are non-authoritative.
- **Tick scheduling:** browser accumulator may run multiple updates after a stall, with an explicit catch-up cap and visible slow-mode/overflow policy. Do not silently change timestep. Mouse deltas must be assigned to ticks consistently.
- **Input locking:** pointer lock requires a user gesture; provide an accessible start control and a way to exit/reset. Avoid treating browser key-repeat timing as simulation input.

## ABI and memory

Define a small versioned ABI before implementing it, for example:

```c
/* Sketch only — no PhaseOne implementation exports exist yet. */
uint32_t phaseone_abi_version(void);
int32_t phaseone_reset(uint32_t seed);
int32_t phaseone_step(const uint8_t *input_bytes, uint32_t input_len);
uint32_t phaseone_state_size(void);
int32_t phaseone_serialize_state(uint8_t *out, uint32_t capacity);
```

The implementation must document exported symbol names, pointer/memory bounds, input record format, integer widths, failures, buffer ownership, module instantiation, and how JavaScript accesses WASM linear memory. Never hand out a pointer whose storage becomes invalid after memory growth. Prefer copying bounded snapshots through explicit buffers over relying on compiler-dependent C struct layout.

## Replay format and comparison

Define a **versioned canonical trace** (either documented binary layout or strict text/JSON converted to canonical bytes). Every record has a tick number, normalized input and, if applicable, a seed. Define endian order (little-endian for binary data), serialization field order, units, signedness, and overflow behavior. Encode authoritative values explicitly; do not serialize raw C structs, pointers, padding, addresses, or GPU state.

Use identical trace bytes on both builds and compare the **canonical authoritative state** at named checkpoints and at completion. Hashes are a useful summary, not a substitute for field-level diagnosis. A failure must preserve first-divergence tick and differing fields.

## Browser/platform constraints

- Serve WASM and JavaScript over HTTP on localhost (e.g. Python standard-library HTTP server), or via a static host; do not assume unrestricted `file://` fetching.
- WebGL 2 feature detection must provide a clear unsupported-browser message.
- The browser host must report WASM load failures, pointer-lock denial, and graphics context loss rather than crashing silently.
- No remote API, authentication, telemetry, GPU compute, worker cross-origin isolation, memory64, or shared-memory requirement is introduced in PHASEONE-001.
- WebGL frames will not be asserted pixel-identical across GPUs; correctness checks focus on simulation, browser interactions, and visual smoke testing.

## Relationship to VANILLAJS

PhaseOne may **study or selectively reuse** separately licensed QSOL-IMC concepts (test methodology, exact-math approaches, asset authoring conventions), subject to explicit code provenance and a clear dependency boundary. It is **not** required to import VANILLAJS or reimplement its full engine. Each project remains independently buildable.
