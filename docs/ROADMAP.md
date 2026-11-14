# PhaseOne roadmap

## Philosophy

**Proof first; game second; scale only after reproducible evidence.** Later phases are proposals, not features already delivered.

| Phase | Goal | Exit condition |
| --- | --- | --- |
| **Phase 0 — Design** | Architecture, originality policy, evidence contract, and demonstrator scope | Reviewed documentation PR merged |
| **PHASEONE-001 — Native-to-Browser Proof** | One C99 simulation built native + WASM; WebGL 2 FPS room; collision/target hit; canonical replay evidence | All G1–G7 in [PHASEONE-001](PHASEONE-001.md) executed and satisfied |
| **PHASEONE-002 — Systems Foundation** | Input remapping, scene/entity definitions, save/load format, sound events, renderer robustness | Tested schemas, deterministic save/replay, and a small multi-room prototype |
| **PHASEONE-003 — Gameplay Vertical Slice** | Original combat feel, enemy behavior, objectives, UI, sound design, small narrative scenario | Complete short experience with end-to-end replay and UX tests |
| **PHASEONE-004 — World and Mod Foundations** | Asset pipeline, level authoring, spatial streaming experiments, explicit mod data contracts | Reproducible asset builds and isolated, documented mod-loading tests |
| **PHASEONE-005 — Advanced Browser Capabilities** | Evaluate WebGPU, worker isolation, performance, and optional native graphics | Measured comparison with WebGL 2 baseline; add only demonstrated wins |

## Decision gates

After every phase, answer:

1. What source was tested, in which environment, with which exact commands and versions?
2. What executed successfully, what failed, and what was not tested?
3. Did native and WASM simulation data retain the stated contract?
4. Does the feature justify its code size, dependencies, maintenance, and browser compatibility costs?
5. Are all code and assets redistributable with recorded provenance?

## Ideas explicitly postponed

Vehicles, a larger world, AI factions, more advanced physics, WebGPU, WASM threads, memory64, moddable campaigns, a native rendered client, and deep integration with VANILLAJS or other QSOL-IMC research may be explored **after** the first demonstrator establishes a trusted foundation.

Do not mistake a roadmap item for a committed delivery schedule or completed capability.
