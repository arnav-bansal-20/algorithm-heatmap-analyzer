"""
JavaScript Sandbox Runner for executing untrusted Node.js code safely.
"""

import os
import shutil
import tempfile
from typing import Tuple, Optional
from app.sandbox.runner import SecureSubprocessSandbox, ExecutionResult

class JsRunner:
    @staticmethod
    def get_node_bin() -> str:
        for p in ["/opt/homebrew/bin/node", "/usr/local/bin/node", shutil.which("node")]:
            if p and os.path.exists(p) and os.access(p, os.X_OK):
                return p
        return "node"

    @staticmethod
    def validate_code(code: str) -> Tuple[bool, Optional[str]]:
        if len(code.encode('utf-8')) > SecureSubprocessSandbox.MAX_CODE_SIZE_BYTES:
            return False, "Code size exceeds maximum limit of 512KB."

        dangerous_patterns = [
            "child_process", "cluster", "dgram", "net.createServer",
            "process.kill", "worker_threads", "http.createServer"
        ]
        for pat in dangerous_patterns:
            if pat in code:
                return False, f"Usage of '{pat}' is prohibited for security reasons."

        return True, None

    @staticmethod
    def execute(
        code: str,
        stdin_data: str = "",
        timeout_sec: float = 3.0,
        memory_mb: int = 256
    ) -> ExecutionResult:
        is_valid, err = JsRunner.validate_code(code)
        if not is_valid:
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=err or "Validation failed",
                exit_code=-1,
                execution_time_ms=0.0,
                memory_bytes=0,
                error_type="SecurityValidationError"
            )

        node_bin = JsRunner.get_node_bin()

        with tempfile.TemporaryDirectory(prefix="agy_js_") as tmpdir:
            script_path = os.path.join(tmpdir, "solution.js")

            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            cmd = [node_bin, f"--max-old-space-size={memory_mb}", script_path]

            return SecureSubprocessSandbox.run_command(
                cmd=cmd,
                cwd=tmpdir,
                stdin_data=stdin_data,
                timeout_sec=timeout_sec,
                memory_mb=memory_mb
            )
