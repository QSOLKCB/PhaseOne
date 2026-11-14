#!/bin/sh
# Copyright 2026 QSOL-IMC. Apache-2.0.
set -eu
cd "$(dirname "$0")/.."
CC=${CC:-cc}
WASM_CC=${WASM_CC:-clang-18}
WASM_LD=${WASM_LD:-wasm-ld-18}
mkdir -p build dist
# Never allow a previous success to masquerade as the result of a failed build.
rm -f build/evidence.json build/native.states build/wasm.states build/phaseone-native dist/phaseone.wasm
python3 scripts/check_toolchain.py build
WASM_LD_PATH=$(command -v "$WASM_LD")
"$CC" -std=c99 -O2 -Wall -Wextra -Werror -pedantic -o build/phaseone-native src/core/phaseone.c src/native/replay.c
"$WASM_CC" --target=wasm32 -fuse-ld="$WASM_LD_PATH" -std=c99 -O2 -Wall -Wextra -Werror -pedantic -ffreestanding -fno-builtin -nostdlib \
  -Wl,--no-entry -Wl,--export-memory -Wl,--initial-memory=131072 -Wl,--max-memory=131072 \
  -Wl,-z,stack-size=16384 -Wl,--export=phaseone_abi_version -Wl,--export=phaseone_require_abi \
  -Wl,--export=phaseone_reset -Wl,--export=phaseone_step -Wl,--export=phaseone_state_size \
  -Wl,--export=phaseone_serialize_state -Wl,--export=phaseone_input_ptr -Wl,--export=phaseone_state_ptr \
  -o dist/phaseone.wasm src/core/phaseone.c
cp src/web/index.html src/web/game.js src/web/renderer.js src/web/input.mjs dist/
if [ -f LICENSE ]; then cp LICENSE dist/LICENSE; fi
python3 scripts/trace_encode.py tests/traces/phaseone-001.json dist/phaseone-001.bin
printf '%s\n' 'Built build/phaseone-native and dist/ (phaseone.wasm + static web host)'
