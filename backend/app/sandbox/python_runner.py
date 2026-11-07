"""
Python Sandbox Runner for executing untrusted Python code in isolated subprocess.
"""

import sys
import ast
import tempfile
import os
from typing import Tuple, Optional
from app.sandbox.runner import SecureSubprocessSandbox, ExecutionResult

class PythonRunner:
    @staticmethod
    def validate_code(code: str) -> Tuple[bool, Optional[str]]:
        """Validates Python syntax and checks for blocked security modules."""
        if len(code.encode('utf-8')) > SecureSubprocessSandbox.MAX_CODE_SIZE_BYTES:
            return False, "Code size exceeds maximum limit of 512KB."

        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return False, f"SyntaxError at line {e.lineno}: {e.msg}"
        except Exception as e:
            return False, f"Parse error: {str(e)}"

        # Block malicious imports / modules
        dangerous_modules = {
            "subprocess", "shutil", "socket", "http", "urllib", "requests",
            "pty", "ctypes", "_posixsubprocess", "webbrowser"
        }

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root_pkg = alias.name.split('.')[0]
                    if root_pkg in dangerous_modules:
                        return False, f"Import of module '{root_pkg}' is forbidden for security reasons."
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    root_pkg = node.module.split('.')[0]
                    if root_pkg in dangerous_modules:
                        return False, f"Import from module '{root_pkg}' is forbidden for security reasons."

        return True, None

    @staticmethod
    def execute(
        code: str,
        stdin_data: str = "",
        timeout_sec: float = 3.0,
        memory_mb: int = 256
    ) -> ExecutionResult:
        """Executes Python code in an isolated temporary directory via clean python3 subprocess."""
        is_valid, err = PythonRunner.validate_code(code)
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

        with tempfile.TemporaryDirectory(prefix="agy_py_") as tmpdir:
            script_path = os.path.join(tmpdir, "solution.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            # We use sys.executable (the venv python) or python3
            cmd = [sys.executable, "-B", "-S", script_path]

            result = SecureSubprocessSandbox.run_command(
                cmd=cmd,
                cwd=tmpdir,
                stdin_data=stdin_data,
                timeout_sec=timeout_sec,
                memory_mb=memory_mb
            )
            return result

