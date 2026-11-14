#!/usr/bin/env python3
"""Produce a versioned canonical trace. Python standard library only."""
import json
import pathlib
import struct
import sys

FLAG = {"forward": 1, "back": 2, "left": 4, "right": 8, "fire": 16}


def encode(source: pathlib.Path) -> bytes:
    trace = json.loads(source.read_text(encoding="utf-8"))
    if set(trace) != {"schema", "records"} or trace["schema"] != "P1T1":
        raise ValueError("invalid trace schema")
    records = []
    for entry in trace["records"]:
        if not set(entry).issubset({"flags", "yaw", "pitch", "repeat"}) or "flags" not in entry:
            raise ValueError("unexpected fields")
        if not isinstance(entry["flags"], list) or len(entry["flags"]) != len(set(entry["flags"])):
            raise ValueError("invalid flags")
        bits = 0
        for flag in entry["flags"]:
            bits |= FLAG[flag]
        yaw = entry.get("yaw", 0)
        pitch = entry.get("pitch", 0)
        repeat = entry.get("repeat", 1)
        if not all(type(i) is int for i in (yaw, pitch, repeat)) or not (0 <= repeat <= 100000) or abs(yaw) > 300 or abs(pitch) > 300:
            raise ValueError("invalid angle/repeat")
        records.extend([struct.pack("<Bhhxxx", bits, yaw, pitch)] * repeat)
        if len(records) > 100000:
            raise ValueError("trace too large")
    return b"P1T1" + struct.pack("<I", len(records)) + b"".join(records)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: trace_encode.py SOURCE.json OUTPUT.bin")
    pathlib.Path(sys.argv[2]).write_bytes(encode(pathlib.Path(sys.argv[1])))


if __name__ == "__main__":
    main()
