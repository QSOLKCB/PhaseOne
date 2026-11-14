#!/usr/bin/env python3
"""Executed native/WASM parity and failure tests; Python stdlib only.

Run after scripts/build.sh. Does not assert visual browser tests passed.
"""
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import struct
import subprocess

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
DIST = ROOT / "dist"
SNAP_FIELDS = ("tick", "x_mm", "z_mm", "yaw_deci", "pitch_deci", "target_alive", "score")


def cmd(args, *, check=True):
    p = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
    if check and p.returncode:
        raise RuntimeError(f"command failed ({p.returncode}): {' '.join(map(str,args))}\nstdout: {p.stdout}\nstderr: {p.stderr}")
    return p


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def state_at(data, tick):
    start = tick * 32
    b = data[start:start+32]
    if len(b) != 32 or b[:4] != b"P1S1":
        raise ValueError(f"Invalid state at tick {tick}")
    return dict(zip(SNAP_FIELDS, struct.unpack("<IiiiiII", b[4:])))


def compare(native, wasm):
    if len(native) != len(wasm):
        raise ValueError(f"State stream lengths differ: native={len(native)}, WASM={len(wasm)}")
    if len(native) % 32:
        raise ValueError("State stream size is not a multiple of 32")
    for tick in range(len(native)//32):
        left, right = state_at(native,tick), state_at(wasm,tick)
        if left != right:
            differing = {k: {"native": left[k], "wasm": right[k]} for k in SNAP_FIELDS if left[k]!=right[k]}
            raise ValueError(f"First divergence at tick {tick}: {json.dumps(differing,sort_keys=True)}")
    return len(native)//32


def test_rejection(trace):
    native = BUILD / "phaseone-native"
    cases = {"bad_magic": b"ERR!"+trace[4:],
             "truncated_record": trace[:-1],
             "trailing_data": trace+b"\x00",
             "unknown_flags": trace[:8]+bytes([0x80])+trace[9:]}
    for name, data in cases.items():
        path = BUILD / f"invalid-{name}.bin"
        path.write_bytes(data)
        p = cmd([str(native),str(path),str(BUILD/f"invalid-{name}.states")],check=False)
        if p.returncode == 0:
            raise ValueError(f"Native CLI accepted {name}")


def main():
    native_exe=BUILD/"phaseone-native"
    wasm_module=DIST/"phaseone.wasm"
    trace_path=DIST/"phaseone-001.bin"
    node=shutil.which("node")
    if node is None:
        raise SystemExit("Node.js required for automated WASM parity runner (no npm packages); browser demo has no Node dependency")
    cmd([str(native_exe),"--selftest"])
    cmd([str(native_exe),str(trace_path),str(BUILD/"native.states")])
    cmd([node,str(ROOT/"scripts/replay-wasm.mjs"),str(wasm_module),str(trace_path),str(BUILD/"wasm.states")])
    native_bytes=(BUILD/"native.states").read_bytes()
    wasm_bytes=(BUILD/"wasm.states").read_bytes()
    count=compare(native_bytes,wasm_bytes)
    altered=bytearray(wasm_bytes)
    altered[32+8] ^= 1
    try:
        compare(native_bytes,bytes(altered))
    except ValueError as exc:
        if "tick 1" not in str(exc) or "x_mm" not in str(exc):
            raise ValueError("Negative control did not identify tick and field") from exc
    else:
        raise ValueError("Negative control was not caught")
    test_rejection(trace_path.read_bytes())
    if count != 312:
        raise ValueError(f"Unexpected snapshot count: {count}")
    goldens = {
        8: {"x_mm":0,"z_mm":3700},
        11: {"x_mm":300,"z_mm":3700},
        12: {"score":0,"target_alive":1,"yaw_deci":100},
        13: {"score":1,"target_alive":0,"yaw_deci":0},
        14: {"score":1,"target_alive":0},
        19: {"x_mm":655,"z_mm":3345},
        24: {"pitch_deci":150},
        25: {"pitch_deci":0},
        120: {"x_mm":155,"z_mm":-5255},
        311: {"x_mm":-4345,"z_mm":-2995,"yaw_deci":-300}
    }
    for tick, expected in goldens.items():
        actual=state_at(native_bytes,tick)
        for field,value in expected.items():
            if actual[field]!=value:
                raise ValueError(f"Independent golden failure at tick {tick}: {field}: {actual[field]} != {value}")
    if state_at(native_bytes,0) != {"tick":0,"x_mm":0,"z_mm":4500,"yaw_deci":0,"pitch_deci":0,"target_alive":1,"score":0}:
        raise ValueError("Unexpected initial state")
    receipts = {
        "schema":"phaseone-evidence-v1",
        "status":"PASS",
        "scope":"Native selftests + CLI malformed trace rejection + WASM ABI negative tests + canonical replay parity. No visual browser proof.",
        "source_sha": cmd(["git","rev-parse","HEAD"],check=False).stdout.strip() or "LOCAL_WORKTREE_NO_COMMIT",
        "tree_status": cmd(["git","status","--porcelain"],check=False).stdout.strip() or "unknown/not-a-git-repo",
        "platform": platform.platform(),
        "native_cc_version": cmd([os.getenv("CC","cc"),"--version"]).stdout.splitlines()[0],
        "wasm_cc_version": cmd([os.getenv("WASM_CC","clang"),"--version"]).stdout.splitlines()[0],
        "node_version": cmd([node,"--version"]).stdout.strip(),
        "python_version": platform.python_version(),
        "trace_sha256":sha(trace_path),"native_states_sha256":sha(BUILD/"native.states"),
        "wasm_states_sha256":sha(BUILD/"wasm.states"),"wasm_module_sha256":sha(wasm_module),
        "ticks":count-1,"snapshots":count,
        "commands":["./scripts/build.sh","python3 scripts/verify.py"],
        "checks": {"native_selftest":"PASS","wasm_abi":"PASS","native_wasm_replay":"PASS",
                   "malformed_traces":"PASS","mismatch_detection":"PASS","headless_browser_visual":"NOT RUN"}
    }
    (BUILD/"evidence.json").write_text(json.dumps(receipts,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps(receipts,indent=2,sort_keys=True))


if __name__ == "__main__":
    main()
