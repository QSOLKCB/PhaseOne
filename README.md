# PhaseOne

**An original first-person browser game experiment: game logic first, native and web targets second.**

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Native and WebAssembly proof](https://github.com/QSOLKCB/PhaseOne/actions/workflows/ci.yml/badge.svg)](https://github.com/QSOLKCB/PhaseOne/actions/workflows/ci.yml)
![Milestone: PHASEONE-001](https://img.shields.io/badge/milestone-PHASEONE--001-blueviolet)

> **Write the C99 simulation once. Run it natively. Compile to WebAssembly. Render using WebGL 2.**

PhaseOne is a QSOL-IMC experiment in compiling an original first-person game-oriented **C99 simulation** to both a native Linux headless runner and a browser WASM runtime. Browser presentation uses a thin, static JavaScript host and original procedural WebGL 2 graphics. It is **not** a port or reproduction of an existing proprietary game.

## PHASEONE-001 — runnable technical demonstration

This implementation provides:
- C99 fixed-tick integer simulation: first-person motion, wall/obstacle collision, aiming, target hit detection and score.
- Native CLI replay and direct LLVM/Clang `wasm32` compilation from the **identical C99 core** (no full game engine or Emscripten runtime).
- One small original WebGL 2 training chamber, pointer-lock mouse look, WASD, firing and reset.
- A versioned input and snapshot ABI, replay trace, expected reference states, negative tests and native/WASM parity verification.
- Static browser files without an online gameplay service, npm dependencies or external game assets.

**Verification boundary:** native and WASM replay parity was executed locally across 311 ticks (312 snapshots), with identical state bytes and deliberate mismatch detection. Browser rendering and gameplay are *implemented but not yet verified in an interactive browser*; do not consider all PHASEONE-001 gates complete.

## Run locally

Prerequisites: C99 compiler; **Clang/LLD 18.1.3** (see `.llvm-version`); Python 3; **Node 22.23.4** only for development-time replay tests (see `.node-version`; no npm install). The build fails closed on version mismatches. For Ubuntu 24.04 install `clang-18 lld-18`; consult [implementation notes](docs/IMPLEMENTATION-001.md) for acquisition instructions.

```sh
./scripts/build.sh
python3 scripts/verify.py
python3 -m http.server 8000 --directory dist
```

Navigate to `http://localhost:8000/`. Select **ENTER SIMULATION**, then use WASD, mouse look, left click to fire, Escape to release, and R to reset. The browser must support WebAssembly, pointer lock and WebGL 2. The built-in WASM/browser replay diagnostic is available at `/?selftest=1`; its JSON report is exposed through the page's `#test-report` element.

The compiler and test dependencies are **development tools**; the browser bundle contains only HTML/CSS/JS, WebAssembly, and procedural geometry. Build artifacts are generated in `dist/` and `build/` and are not committed. No automatic Pages deployment or release is added.

## Documentation

| Document | Purpose |
| --- | --- |
| [PHASEONE-001](docs/PHASEONE-001.md) | Acceptance gates and minimal vertical slice |
| [Implementation notes](docs/IMPLEMENTATION-001.md) | Current code, local commands, ABI, reproducibility and limitations |
| [Architecture](docs/ARCHITECTURE.md) | Simulation/host split, replay contract and portability |
| [ADR-0001](docs/ADR-0001.md) | Why C99 + WASM + WebGL 2 |
| [Evidence protocol](docs/EVIDENCE.md) | Source-pinned evidence, divergence and failure handling |
| [Originality](docs/ORIGINALITY.md) | Original code/art/IP boundary and third-party provenance |
| [Roadmap](docs/ROADMAP.md) | Deliberate expansion after technical gates pass |
| [Contributor instructions](AGENTS.md) | Scope and review rules |

## Principles

**Correctness before performance. Offline-first. No heavyweight browser runtime. Original game IP. No hidden cloud services.**

The source code is Apache-2.0 licensed. Original assets and third-party materials follow the provenance policy.

**Maintained by QSOL-IMC.**
