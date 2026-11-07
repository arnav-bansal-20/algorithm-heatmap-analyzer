"""
C++ Sandbox Runner for compiling and executing untrusted C++ code.
"""

import os
import shutil
import tempfile
import time
from typing import Tuple, Optional
from app.sandbox.runner import SecureSubprocessSandbox, ExecutionResult

class CppRunner:
    @staticmethod
    def get_compiler() -> str:
        for comp in ["clang++", "g++"]:
            path = shutil.which(comp)
            if path:
                return path
        return "clang++"

    @staticmethod
    def validate_code(code: str) -> Tuple[bool, Optional[str]]:
        if len(code.encode('utf-8')) > SecureSubprocessSandbox.MAX_CODE_SIZE_BYTES:
            return False, "Code size exceeds maximum limit of 512KB."

        dangerous_patterns = [
            "system(", "popen(", "fork(", "execve(", "execl(",
            "<sys/socket.h>", "<netinet/in.h>", "<arpa/inet.h>"
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
        is_valid, err = CppRunner.validate_code(code)
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

        compiler = CppRunner.get_compiler()

        with tempfile.TemporaryDirectory(prefix="agy_cpp_") as tmpdir:
            src_path = os.path.join(tmpdir, "solution.cpp")
            bin_path = os.path.join(tmpdir, "solution.bin")

            with open(src_path, "w", encoding="utf-8") as f:
                f.write(code)

            # Compilation Phase
            compile_start = time.perf_counter_ns()
            compile_cmd = [compiler, "-std=c++17", "-O2", "-Wall", src_path, "-o", bin_path]
            compile_res = SecureSubprocessSandbox.run_command(
                cmd=compile_cmd,
                cwd=tmpdir,
                timeout_sec=6.0
            )
            compile_time_ms = round((time.perf_counter_ns() - compile_start) / 1_000_000.0, 3)

            if not compile_res.success or not os.path.exists(bin_path):
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
            exec_res = SecureSubprocessSandbox.run_command(
                cmd=[bin_path],
                cwd=tmpdir,
                stdin_data=stdin_data,
                timeout_sec=timeout_sec,
                memory_mb=memory_mb
            )
            exec_res.compilation_time_ms = compile_time_ms
            return exec_res

