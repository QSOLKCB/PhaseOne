# PHASEONE-001: implemented native/WASM demonstrator

**Status:** Under review. This document describes built source, not a completed browser-visual verification or a production release.

## Architecture

- Portable **C99 simulation** in `src/core/phaseone.c`: fixed 60 Hz tick, integer first-person movement and collision, angular hit-test, target lifecycle and score. Authoritative logic uses no floating point.
- **Native Linux headless replay** in `src/native/replay.c`: reads canonical input records, writes 32-byte serialized snapshots, checks native gameplay and malformed inputs.
- **Freestanding WebAssembly** compiled from the **same core C99 source** by `clang --target=wasm32` and `wasm-ld`. This proof uses LLVM directly without Emscripten's runtime, a smaller implementation of the accepted C99-to-WebAssembly strategy.
- **Browser host** in `src/web/`: original procedural WebGL 2 training room, WASM loading and bounded linear-memory I/O, normalized WASD/mouse input, pointer lock, first-person camera, reset control, score/target HUD.
- **Comparison** in `scripts/verify.py`: 311 replay ticks and 312 serialized state checkpoints; byte-for-byte matching native and WASM results, independent golden assertions, deliberate mutation detection and negative ABI tests. Development-only Node.js runs WASM; no npm packages are used.

## Build and run

Development prerequisites: a native C99 compiler, **LLVM Clang 18.1.3 and LLD 18.1.3**, Python 3, and **Node.js 22.23.4 only for the development-time WASM replay comparator**. These exact versions are enforced by `scripts/check_toolchain.py`, using `.llvm-version` and `.node-version`. The browser uses only static HTML/CSS/JS, WebAssembly and WebGL 2—no Node, npm or external assets.

For Ubuntu 24.04, acquire the compiler/linker using `sudo apt-get update && sudo apt-get install clang-18 lld-18`, and check that `clang-18 --version` and `wasm-ld-18 --version` both report 18.1.3. Obtain Node 22.23.4 from the official Node.js release archive (or with an existing nvm: `nvm install 22.23.4`); verify with `node --version`. CI selects Node using `actions/setup-node` with the exact .node-version file. Other distributions can install the same versions through their own package repositories or pinned offline archives; if the version differs, the check intentionally fails. No installer is executed by the local build scripts.

`WASM_CC`, `WASM_LD`, and `NODE` may override executable **paths**, but not required versions. The linker path is passed explicitly to Clang via `-fuse-ld`. The native C compiler is recorded but is not version-pinned, to independently test portability. An externally obtained, byte-for-byte identical compiler binary is *not* guaranteed by matching upstream version numbers alone.

```sh
./scripts/build.sh
python3 scripts/verify.py
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000/` in a WebGL 2 capable browser. Press **ENTER SIMULATION** (pointer lock requires a gesture), use **W/A/S/D**, mouse to look, left click to fire at the target, **Escape** to release, and **R** to reset. The original training room is intentionally small.

`http://localhost:8000/?selftest=1` invokes the browser's own WASM replay and ABI failure checks. A JSON result, including canonical snapshots, is written to `#test-report`. It can be independently compared with `build/native.states`. A successful selftest is not proof of user interaction quality.

Generated `build/` and `dist/` are gitignored. `dist/` contains a static browser bundle. No deploy, release, or Pages policy change is included.

## Versioned ABI (v1)

**Trace P1T1:** 4 ASCII magic bytes plus `u32le` record count, followed by exactly N records. Record format is eight bytes: flags `u8` (forward 1, back 2, left 4, right 8, fire 16), yaw delta `i16le`, pitch delta `i16le`, three reserved zero bytes. Angles are tenths of a degree, limited to ±300 per tick.

**State P1S1:** 4 ASCII magic bytes followed by seven explicit 32-bit little-endian fields: `tick:u32`, `x_mm:i32`, `z_mm:i32`, `yaw_deci:i32`, `pitch_deci:i32`, `target_alive:u32`, `score:u32`. Serialized state is exactly 32 bytes. Never hash raw C structs or padding.

**Exports:** `phaseone_abi_version`, `phaseone_require_abi`, `phaseone_reset`, `phaseone_step`, `phaseone_state_size`, `phaseone_serialize_state`, `phaseone_input_ptr`, `phaseone_state_ptr`, and `memory`. The input/output pointers are static WASM buffers, with no heap allocation or memory growth.

**Error codes:** 0 success, -1 null pointer, -2 invalid input length, -3 malformed record, -4 output buffer too short, -5 ABI version mismatch.

**Simulation:** Start position is x=0, z=4500 mm, facing negative Z. Step size is 100 mm per pure directional tick or 71 mm per diagonal component. Boundaries are ±6250 mm; the block occupies x 1000..2500, z -2000..1000 mm, with 250 mm player clearance. Yaw wraps at ±180 degrees; pitch clamps to ±80 degrees. Integer sine/cosine values come from an explicitly generated lookup table interpolated in tenths of a degree. The target sits at x=0, z=-4000 and can be hit once when within range, horizontal heading tolerance and pitch tolerance. This is a simplified demonstrator, **not** a complete occlusion-aware shooting model.

## Evidence and current limitations

Local reference environment for this PR's initial proof: Debian GCC 14.2.0, LLVM Clang 17.0.0 (wasm32), Node 22.16.0, Python 3.13.5. The output traces and byte-for-byte hashes are produced by `python3 scripts/verify.py` in `build/evidence.json`; CI records its own versions and exact PR head SHA. An interrupted run leaves a RUNNING, never a stale PASS, receipt. Exact LLVM/LLD and Node versions are now enforced by the committed version files; the verifier initializes a fresh RUNNING receipt before executing checks, writes FAIL status and command diagnostics on any failure, and records PASS only on completion. Native selftest failure and stale-receipt protection have dedicated regression tests.

**Executed:** native tests, native invalid-trace rejection, native/WASM ABI checks, independent state goldens, intentional comparator mutation, and 312-snapshot native-vs-WASM parity using a JS WASM runtime.

**Not yet executed in this environment:** interactive browser controls and visible WebGL rendering; local Chromium headless fails/hangs even on a trivial page. These must be tested separately and G2/G3 remain **pending**. Native execution is headless, not a second graphics client. Browser/WASM selftest is supplied but is not itself claimed to have passed.

No animation pipeline, enemies, audio, vehicle systems, asset streaming, full ray occlusion, WebGPU, threads, or open-world content. This proof uses entirely original procedural graphics and source; see `docs/ORIGINALITY.md`.
