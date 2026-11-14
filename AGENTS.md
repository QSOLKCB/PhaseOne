# PhaseOne contributor and agent instructions

## Mission and authority

PhaseOne is an **original** game-first-to-browser technical demonstrator. Follow [docs/PHASEONE-001.md](docs/PHASEONE-001.md) for the next implementation milestone. The owner decides whether to merge or release; opening a PR does not authorize merging, tagging, deploying, or changing repository settings.

## Engineering boundaries

1. Keep the **simulation core in portable C99**. Browser-host bindings and the rendering adapter may be JavaScript. Do not silently introduce C++, Rust, a full third-party game engine, Node/npm, Docker, Kubernetes, cloud services, or a second runtime.
2. Compile the **same simulation source** to native headless and WebAssembly targets. Platform-specific code belongs in hosts/adapters. Keep native-only and browser-only build differences explicit.
3. WebGL 2 is the initial renderer; WebGPU, multi-threading, memory64, vehicles, open worlds, and large asset pipelines are **deferred**, not implicit requirements.
4. Use a fixed simulation tick and normalized inputs. Avoid hidden time, random, locale, filesystem, networking, GPU, or DOM dependencies inside the core. Specify deterministic PRNG and serialization before claiming replay parity.
5. Treat file layouts in architecture documents as **proposals**, not as already implemented files.
6. Prefer simple C/Python standard-library tooling; pin necessary nonstandard tool versions and record how they were obtained. Do not silently fetch tools at runtime.

## Proof and review standards

- Separate **observed**, **reproduced**, **not yet tested**, and **proposed** assertions.
- Preserve failing traces and diagnostics. Never alter expected values just to force a pass.
- Compare canonical serialized simulation state; do not hash struct padding or unspecified memory.
- Provide exact source commit SHA, toolchain versions, build commands, execution logs, exit codes, trace hashes, and output hashes as specified in [docs/EVIDENCE.md](docs/EVIDENCE.md).
- Prefer small PRs with a clear test matrix and explicit limitations.
- Never claim the native build renders graphics when it only runs simulation headlessly.
- Documentation-only changes do not imply runtime verification.

## Originality and asset safety

- Implement original code, narrative, names, environments, art, and audio. Do not copy or import game assets or code from proprietary works, even when technical architecture is inspired by public demonstrations.
- Record source, author, licence, permitted use, and any required attribution for third-party material.
- Reject unknown-provenance assets until rights are established. Record any use of generated assets and the permitted distribution basis.
- Preserve Apache-2.0 for repository source code unless the owner approves a licence change.

## Change management

No merging, tagging, release publication, credential changes, or repository policy modifications without explicit owner authorization. Keep review comments and technical failures auditable.
