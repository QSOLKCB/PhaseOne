# PHASEONE-001 — Native-to-Browser Proof

**Status:** Planned. **Deliverable of this document:** an executable specification for a *future implementation PR*, not a claim that the demonstrator already runs.

## Hypothesis

A single original, portable C99 gameplay core can drive both:

- a Linux native **headless** executable for input-replay testing; and
- a browser-based, WebGL 2 first-person interactive scene through WebAssembly and a thin JavaScript host.

The experiment succeeds if the same trace yields matching specified canonical authoritative state on both builds **and** the browser player can interact with a coherent playable environment.

## Minimum demonstrator

**Scene:** one room with a floor, walls, a few collision blocks, and at least one clearly visible static target. Geometry and colours can be procedural. The experience must be original and not derived from a proprietary game map or assets.

**Player:** first-person camera, WASD movement, mouse-look with pointer lock, bounded pitch, collision with room geometry, and a visible indication of the active controls.

**Interaction:** a simple fire action, hit detection against a static target, target-state change, and a visible score/state indicator. No weapons library, enemy AI, combat balancing, missions, or multiplayer required.

**Simulation:** authoritative C99 movement, collision, and hit logic at a fixed tick; normalized input; explicit state serialization.

**Outputs:** native headless executable, WASM module with documented ABI, static browser bundle, reproducible trace comparison, and honest evidence.

## In scope

1. Build the **same core C99 source** as native and WASM using documented, versioned compiler commands.
2. Define an ABI contract and data formats for initializing, ticking, and reading state.
3. Build a simple WebGL 2 browser presentation; the browser host handles input, timing, resize, graphics errors, and WASM memory access.
4. Add a canonical replay trace that tests movement, collision, repeated stepping, fire miss/hit, and reset.
5. Compare canonical state snapshots at checkpoints; preserve first mismatch, full expected/actual fields, and exit status.
6. Serve the browser build locally without network services. Verify a static-host deployment path separately if enabled.
7. Capture compiler versions, commands, input/output SHA-256, exact Git commit, environment, logs, and test outcomes.

## Explicit non-goals

- Open-world streaming, GTA-like scale, licensed game compatibility, vehicles, NPC factions, quests, animation pipelines, complex art, and audio production.
- WebGPU, compute shaders, multi-threaded WASM, shared memory, memory64, PWA installation, or a required native graphical renderer.
- Bit-identical rendering, blanket floating-point parity, automatic formal verification, or benchmarking against commercial games.
- Runtime Node/npm, external online gameplay APIs, cloud build services required for local reproduction, or mandatory game-engine dependencies.

## Acceptance gates (all must be evidenced)

| Gate | Required observable evidence |
| --- | --- |
| G1 — Portable core | Native and WASM build commands both succeed from the documented C99 core sources; tool versions recorded |
| G2 — Browser scene | Browser opens a rendered WebGL 2 room with a controllable first-person view and a start/reset path |
| G3 — Game interaction | Player movement and room collisions behave as specified; static target can be hit and updates authoritative state |
| G4 — Replay parity | The **same canonical input bytes** produce matching authoritative snapshots at defined checkpoints and completion, or a mismatch blocks acceptance |
| G5 — Inspectable failure | Negative tests exercise malformed input, invalid ABI/buffer bounds, unsupported WebGL 2, and failed WASM loading without silent success |
| G6 — Reproduction | Source SHA, versions, exact commands, environment, exit codes, trace and result hashes, and first-divergence diagnostics are captured |
| G7 — Original and static | All distributed assets have original or documented redistributable provenance; bundle runs from localhost with no mandatory remote service |

**Success is conditional on actual execution.** Do not prepopulate PASS fields. A green CI icon alone is not evidence of native/browser parity. G4 comparisons apply to the **defined integer/fixed-point simulation state**; pixels, shaders, wall-clock frame timing, and unspecified floating-point intermediate values are excluded.

## Required test cases

- Reset to a known snapshot and replay the same trace twice.
- Move forward/back/strafe and rotate; validate room collision boundaries.
- Fire once to miss, once to hit; assert score/target state transitions and repeat-fire behavior.
- Feed a zero-length or malformed input record; require an explicit error instead of memory corruption.
- Test a too-small snapshot buffer and unsupported ABI version.
- Browser smoke: load, start gesture, pointer-lock grant/denial, input, target result, resize, context failure path, and reset.
- Negative control: deliberately mutate one trace event; ensure parity/evidence tooling detects and reports a mismatch.

## Implementation slices (separate reviewable PRs encouraged)

1. **Core + native headless runner:** define state, ABI header, trace schema, serializer and native golden tests.
2. **WASM build + browser host:** link core into WASM, load/step it from a minimal page, and compare trace state with native.
3. **WebGL 2 presentation + interaction:** draw procedural room, capture input, render camera/HUD, test target and collision visually.
4. **Evidence + polish:** lock toolchain versions, improve failure tests, record tested browser/OS environments and publish a reproducible demonstration report.

Slices are sequencing guidance, not a reason to label the experiment successful before all gates pass.

## Performance evidence (not a premature pass threshold)

Record frame-time distribution, tick backlog and WASM update time on a named machine and browser, together with device/GPU details. A 60 Hz simulation tick is a design choice, **not** a verified 60 FPS rendering result. Do not optimize before recording correct baseline behaviour.

## Definition of done

A future PR or PR series may close PHASEONE-001 only after **G1–G7** have evidence links or reproducible local artifacts and all failures are either corrected or explicitly scoped as blocking. This documentation PR satisfies **none** of those runtime gates.
