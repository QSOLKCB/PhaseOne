"""Regression: a failing verification run must overwrite a previous PASS receipt."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import verify


class FailureReceiptTests(unittest.TestCase):
    def setup_local(self, directory):
        build = Path(directory) / "build"
        dist = Path(directory) / "dist"
        build.mkdir()
        dist.mkdir()
        (build / "evidence.json").write_text('{"status":"PASS","source_sha":"stale"}',encoding="utf-8")
        return build, dist

    def fake_process(self, argv, **_kwargs):
        if str(argv[-1]) == "replay" and "check_toolchain.py" in str(argv[-2]):
            return subprocess.CompletedProcess(argv, 0, "pins OK", "")
        if len(argv) > 1 and argv[1] == "--selftest":
            return subprocess.CompletedProcess(argv, 9, "", "injected selftest failure")
        if argv[:3] == ["git", "rev-parse", "HEAD"]:
            return subprocess.CompletedProcess(argv, 0, "mock-commit\n", "")
        if argv[:3] == ["git", "status", "--porcelain"]:
            return subprocess.CompletedProcess(argv, 0, "", "")
        raise AssertionError(f"unexpected command {argv}")

    def test_selftest_failure_replaces_stale_pass_and_logs_exit_code(self):
        with tempfile.TemporaryDirectory() as directory:
            build, dist = self.setup_local(directory)
            with mock.patch.object(verify, "BUILD", build), mock.patch.object(verify, "DIST", dist),\
                 mock.patch.object(verify.subprocess, "run", side_effect=self.fake_process),\
                 mock.patch.dict(os.environ, {"PHASEONE_BUILD_OUTCOME":"LOCAL/NOT-REPORTED"}):
                with self.assertRaisesRegex(RuntimeError, "injected selftest failure"):
                    verify.main()
            receipt = json.loads((build/"evidence.json").read_text())
            self.assertEqual(receipt["status"], "FAIL")
            self.assertEqual(receipt["failed_check"], "native_selftest")
            self.assertEqual(receipt["checks"]["native_selftest"], "FAIL")
            self.assertEqual(receipt["source_sha"], "mock-commit")
            self.assertTrue(any(c["exit_code"] == 9 and
                                "injected selftest failure" in c["stderr_tail"]
                                for c in receipt["command_log"]))
            self.assertIn("injected selftest failure",receipt["diagnostics"]["message"])
            self.assertNotEqual(receipt["source_sha"], "stale")

    def test_failed_ci_build_produces_failure_receipt_without_replay(self):
        with tempfile.TemporaryDirectory() as directory:
            build, dist = self.setup_local(directory)
            (build/"build.log").write_text("compiler failure at stage 2",encoding="utf-8")
            with mock.patch.object(verify,"BUILD",build), mock.patch.object(verify,"DIST",dist),\
                 mock.patch.object(verify.subprocess,"run",side_effect=self.fake_process),\
                 mock.patch.dict(os.environ,{"PHASEONE_BUILD_OUTCOME":"failure"}):
                with self.assertRaisesRegex(RuntimeError, "compiler failure"):
                    verify.main()
            receipt = json.loads((build/"evidence.json").read_text())
            self.assertEqual(receipt["status"],"FAIL")
            self.assertEqual(receipt["failed_check"],"build")
            self.assertEqual(receipt["checks"]["build"],"FAIL")
            self.assertIn("compiler failure",receipt["diagnostics"]["message"])


if __name__ == "__main__":
    unittest.main()
