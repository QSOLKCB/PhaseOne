#!/usr/bin/env python3
"""Fail-closed versions for nonstandard PHASEONE-001 build and replay tools.

Uses the exact repository pins; never installs tools or downloads dependencies.
"""
from pathlib import Path
import os
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent


class ToolchainError(RuntimeError):
    pass


def pinned(name):
    return (ROOT / name).read_text(encoding="ascii").strip()


def tool_version(binary):
    try:
        result = subprocess.run([binary, "--version"], capture_output=True,
                                text=True, check=False)
    except OSError as exc:
        raise ToolchainError(f"required tool {binary!r} missing: {exc}") from exc
    if result.returncode:
        raise ToolchainError(f"{binary!r} --version returned {result.returncode}: {result.stderr.strip()}")
    return result.stdout.strip().splitlines()[0]


def require(binary, pattern, expected):
    version = tool_version(binary)
    match = re.search(pattern, version)
    if match is None or match.group(1) != expected:
        raise ToolchainError(f"{binary}: required {expected}, found {version!r}")
    return version


def check(mode):
    if mode not in ("build", "replay", "all"):
        raise ToolchainError("usage: check_toolchain.py build|replay|all")
    versions = {}
    if mode in ("build", "all"):
        llvm = pinned(".llvm-version")
        versions["clang"] = require(os.environ.get("WASM_CC", "clang-18"),
                                    r"clang version (\d+\.\d+\.\d+)", llvm)
        versions["wasm-ld"] = require(os.environ.get("WASM_LD", "wasm-ld-18"),
                                      r"LLD (\d+\.\d+\.\d+)", llvm)
    if mode in ("replay", "all"):
        node = pinned(".node-version")
        versions["node"] = require(os.environ.get("NODE", "node"),
                                    r"^v(\d+\.\d+\.\d+)$", node)
    return versions


if __name__ == "__main__":
    try:
        versions = check(sys.argv[1] if len(sys.argv) == 2 else "")
        for name, version in versions.items():
            print(f"{name}: {version}")
    except (ToolchainError, OSError) as exc:
        print(f"Toolchain pin check FAILED: {exc}", file=sys.stderr)
        raise SystemExit(2) from exc
