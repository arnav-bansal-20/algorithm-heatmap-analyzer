"""
Java Sandbox Runner for compiling and executing untrusted Java code.
"""

import os
import shutil
import tempfile
import time
import re
from typing import Tuple, Optional
from app.sandbox.runner import SecureSubprocessSandbox, ExecutionResult

class JavaRunner:
    @staticmethod
    def is_available() -> Tuple[bool, str]:
        javac = shutil.which("javac")
        java = shutil.which("java")
        if not javac or not java:
            return False, "Java JDK is not found in PATH."
        # Verify javac runs
        res = SecureSubprocessSandbox.run_command(["javac", "-version"], cwd="/tmp", timeout_sec=2.0)
        if not res.success:
            return False, "Java compiler (javac) failed to execute on this environment."
        return True, "Java runtime available."

    @staticmethod
    def validate_code(code: str) -> Tuple[bool, Optional[str]]:
        if len(code.encode('utf-8')) > SecureSubprocessSandbox.MAX_CODE_SIZE_BYTES:
            return False, "Code size exceeds maximum limit of 512KB."

        dangerous_patterns = [
            "Runtime.getRuntime()", "ProcessBuilder", "java.net.",
            "System.exit", "java.lang.reflect", "SecurityManager"
        ]
        for pat in dangerous_patterns:
            if pat in code:
                return False, f"Usage of '{pat}' is prohibited for security reasons."

        return True, None

    @staticmethod
    def extract_class_name(code: str) -> str:
        match = re.search(r'public\s+class\s+([A-Za-z0-9_]+)', code)
        if match:
            return match.group(1)
        match = re.search(r'class\s+([A-Za-z0-9_]+)', code)
        if match:
            return match.group(1)
        return "Solution"

    @staticmethod
    def execute(
        code: str,
        stdin_data: str = "",
        timeout_sec: float = 4.0,
        memory_mb: int = 256
    ) -> ExecutionResult:
        avail, msg = JavaRunner.is_available()
        if not avail:
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Environment Limitation: {msg} Java execution is disabled.",
                exit_code=-1,
                execution_time_ms=0.0,
                memory_bytes=0,
                error_type="EnvironmentUnavailable"
            )

        is_valid, err = JavaRunner.validate_code(code)
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

        class_name = JavaRunner.extract_class_name(code)

        with tempfile.TemporaryDirectory(prefix="agy_java_") as tmpdir:
            src_path = os.path.join(tmpdir, f"{class_name}.java")

            with open(src_path, "w", encoding="utf-8") as f:
                f.write(code)

            # Compilation Phase
            compile_start = time.perf_counter_ns()
            compile_cmd = ["javac", src_path]
            compile_res = SecureSubprocessSandbox.run_command(
                cmd=compile_cmd,
                cwd=tmpdir,
                timeout_sec=6.0
            )
            compile_time_ms = round((time.perf_counter_ns() - compile_start) / 1_000_000.0, 3)

            class_file = os.path.join(tmpdir, f"{class_name}.class")
            if not compile_res.success or not os.path.exists(class_file):
                return ExecutionResult(
                    success=False,
                    stdout="",
                    stderr=f"Compilation Error:\n{compile_res.stderr}",
                    exit_code=compile_res.exit_code or -1,
                    execution_time_ms=0.0,
                    memory_bytes=0,
                    error_type="CompilationError",
                    compilation_time_ms=compile_time_ms
                )

            # Execution Phase
            exec_cmd = ["java", f"-Xmx{memory_mb}m", class_name]
            exec_res = SecureSubprocessSandbox.run_command(
                cmd=exec_cmd,
                cwd=tmpdir,
                stdin_data=stdin_data,
                timeout_sec=timeout_sec,
                memory_mb=memory_mb
            )
            exec_res.compilation_time_ms = compile_time_ms
            return exec_res

