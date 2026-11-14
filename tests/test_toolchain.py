"""Pin checks are executable requirements, not tool-version logging."""
import pathlib
import subprocess
import sys
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import check_toolchain as tc


class PinTests(unittest.TestCase):
    def test_exact_versions_pass(self):
        def version(args, **_kw):
            output = {"clang-18": "Ubuntu clang version 18.1.3 (1ubuntu1)",
                      "wasm-ld-18": "LLD 18.1.3 (compatible with GNU linkers)",
                      "node": "v22.23.4"}[args[0]]
            return subprocess.CompletedProcess(args, 0, output + "\n", "")
        with mock.patch.object(tc.subprocess, "run", side_effect=version), mock.patch.dict(tc.os.environ, {"WASM_CC":"clang-18", "WASM_LD":"wasm-ld-18", "NODE":"node"}):
            self.assertEqual(set(tc.check("all")), {"clang","wasm-ld","node"})

    def test_wrong_llvm_and_node_are_rejected(self):
        for mode, output in (("build","Ubuntu clang version 18.1.2"),
                             ("replay","v22.16.0")):
            def wrong(args, **_kw):
                return subprocess.CompletedProcess(args, 0, output + "\n", "")
            with self.subTest(mode=mode), mock.patch.object(tc.subprocess,"run",side_effect=wrong):
                with self.assertRaises(tc.ToolchainError):
                    tc.check(mode)

    def test_missing_linker_fails_closed(self):
        def run(args, **_kw):
            if args[0].endswith("clang-18"):
                return subprocess.CompletedProcess(args,0,"Ubuntu clang version 18.1.3\n","")
            raise FileNotFoundError("no wasm-ld-18")
        with mock.patch.object(tc.subprocess, "run", side_effect=run):
            with self.assertRaises(tc.ToolchainError):
                tc.check("build")


if __name__ == "__main__":
    unittest.main()
