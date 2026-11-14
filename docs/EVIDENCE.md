# PhaseOne reproducibility and evidence protocol

**Status:** Proposed verification procedure. No tests, scripts, binaries, or proof receipts have yet been executed or produced for PHASEONE-001.

## Principle

Keep **claims, execution evidence, and interpretation** separate. The project's main claim is *same C99 game simulation source compiled for native and WASM, yielding the same specified authoritative results for canonical input*. It is not a universal claim that browser and native computing are identical.

## Minimum receipt per tested revision

Store or publish a plain-text/JSON report documenting:

| Field | Record |
| --- | --- |
| Identity | Exact Git commit SHA; tree status (clean/dirty); timestamp |
| Tools | C compiler, Emscripten/LLVM, Python, browser, and OS versions; target architecture |
| Sources | Core source files, flags, linker settings, and the scripts/commands used |
| Repro | Exact commands in order; cwd; required environment; network/offline assumptions |
| Inputs | Trace format revision, seed if relevant, and SHA-256 of each canonical trace |
| Outputs | SHA-256 of build outputs, authoritative state outputs and logs |
| Results | Per-command exit status; each test pass/fail/skip; reasons for skips |
| Comparison | Checkpoint tick numbers; field-level comparison and first differing tick/field on failure |
| Rendering | Browser/WebGL 2 capability, manual/automated smoke details; no cross-GPU pixel-parity claim |
| Limitations | Unmeasured behaviors, unresolved differences, expected portability limits |

For external dependencies record their version and source; do not silently substitute newer tools in a reproducibility claim.

## Canonical state

Never hash raw C struct bytes. The authoritative serializer must specify schema version, signedness, fixed-point scale if used, unit conventions, field order, byte order, overflow rules, and error codes. Ensure equal record lengths and bytes before comparing digests. Hash mismatch is a **failure requiring diagnosis**, even if graphics appear correct.

At minimum preserve:

- original input trace bytes and trace SHA-256;
- native serialized snapshots at specified checkpoints;
- browser/WASM serialized snapshots at the same checkpoints;
- comparator output including first divergence and reason;
- source SHA, toolchain metadata, full command logs, exit codes, output hashes.

Avoid changing the golden outputs merely to conceal an implementation bug. If the data format changes intentionally, version it and explain the migration.

## Failure categories

Use distinct statuses such as **PASS**, **FAIL**, **SKIP**, and **NOT RUN**, with a description of the condition tested. A skipped WebGL 2 test due to missing browser capabilities does not count as passed. A successful native build without browser execution does not satisfy the browser gate. Store failure traces rather than deleting them.

## Suggested local execution (future)

A future implementation can expose simple scripts such as `scripts/build-native.sh`, `scripts/build-web.sh`, `scripts/replay-compare.py`, and `scripts/collect-evidence.py`. **These paths are examples only and do not exist yet.** A local static browser build may be served using `python3 -m http.server`, subject to the built output directory and documented MIME types. Prefer Python's standard library and explicit compiler invocations over package-manager sprawl.

## Publication gate

A release or performance claim requires reviewed, source-pinned receipts, both-target execution, preserved failures, and owner approval. CI is helpful but not a substitute for proof that the specific browser and WASM tests were executed. Never present design documentation as executed verification.
