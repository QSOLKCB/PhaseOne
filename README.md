# PhaseOne

**An original first-person browser game, developed game-first and compiled for the web.**

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Status: design / documentation](https://img.shields.io/badge/status-design%20%2F%20documentation-lightgrey)
![Milestone: PHASEONE-001](https://img.shields.io/badge/milestone-PHASEONE--001-blueviolet)

> **Write the simulation once. Run it natively. Compile it to WebAssembly. Present it using web standards.**

PhaseOne is a QSOL-IMC technical experiment in developing an **original FPS** with a native, game-oriented simulation core and a browser runtime. It tests a different workflow from browser-first game development: the same C99 gameplay logic must be useful to a native headless program and to a WebAssembly module, while a small JavaScript browser host handles WebGL 2 graphics, input, and eventually Web Audio.

This is **not** a port, remake, compatibility layer, or reverse-engineering project for any existing proprietary game. PhaseOne will use original gameplay, story, names, code, and creative assets.

## Current status

**Documentation and architecture only.** There is no playable game, compiler pipeline, verified cross-target parity, or working browser demo in the repository yet. The first implementation is specified by [PHASEONE-001](docs/PHASEONE-001.md); none of its acceptance criteria are being claimed as achieved by this documentation PR.

## The first technical proof

1. Implement one small **C99 simulation core** that compiles unchanged for a native Linux headless runner and for the browser as WebAssembly.
2. Build one **small first-person test environment** from original/procedural geometry, drawn using WebGL 2 from a thin browser host.
3. Drive a **fixed-tick simulation** with normalized movement/look/fire input, simple collision, and a static target-hit interaction.
4. Replay the same canonical input trace through native and WASM execution; compare specified integer simulation state, log discrepancies, and record reproducible evidence.
5. Package a static browser build that runs from a local HTTP server with no online account, remote gameplay service, or runtime package manager.

The objective is **portable game logic and a demonstrably functioning browser presentation**, not an open-world game or a claim that compiled WASM magically replicates a full native engine.

## Two paths, one simulation

```text
                 PhaseOne C99 game simulation
                              |
                   +----------+----------+
                   |                     |
            Native C compiler     Emscripten / LLVM
                   |                     |
           Headless CLI runner     WebAssembly module
             replay / testing             |
                                Minimal JavaScript host
                                   WebGL 2 / input
                                          |
                                   Browser FPS demo
```

For the first milestone, the **simulation** is shared; rendering is intentionally browser-specific. A native GPU renderer is not required to prove the claim.

## Project documentation

| Document | Purpose |
| --- | --- |
| [PHASEONE-001](docs/PHASEONE-001.md) | First demonstrator scope, deliverables, acceptance criteria, and exclusions |
| [Architecture](docs/ARCHITECTURE.md) | C99/WASM boundary, host responsibilities, fixed-tick simulation, and test data flow |
| [ADR-0001](docs/ADR-0001.md) | Why C99 + WASM + WebGL 2 was selected, and what was rejected |
| [Evidence protocol](docs/EVIDENCE.md) | Reproduction records, cross-target comparisons, and release gates |
| [Originality and licensing](docs/ORIGINALITY.md) | Original IP boundary, asset provenance, and third-party intake policy |
| [Roadmap](docs/ROADMAP.md) | Sequenced expansion after the proof works |
| [Contributor rules](AGENTS.md) | Scope control, evidence standards, and change-management expectations |

## Technical principles

- **Minimal runtime dependencies:** web-standard APIs, a static site, and WASM; compiler and test tools are development dependencies.
- **Correctness over speed:** report executed tests separately from hypotheses. Do not promise exact parity where floating point, toolchain, or browser behavior has not been controlled.
- **Offline-first:** local development and local static serving must work without cloud services. An installable offline cache/service worker is a future, separately tested capability.
- **Originality:** no copyrighted game code, levels, textures, audio, characters, or ripped data.
- **Expandable:** retain interfaces that allow new game systems later, without implementing them prematurely.

## Licence

The repository currently declares **Apache-2.0** for its source code. Future creative assets and third-party material require explicit provenance and documented rights before inclusion; see [Originality](docs/ORIGINALITY.md).

**Maintained by QSOL-IMC.**
