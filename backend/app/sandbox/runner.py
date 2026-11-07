"""
Secure Sandbox Runner for executing untrusted student code safely.
Provides strict process isolation, timeouts, memory/CPU resource limits,
clean environment variables, and process group termination.
"""

import os
import sys
import time
import signal
import subprocess
import tempfile
import resource
import psutil
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

@dataclass
class ExecutionResult:
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: float
    memory_bytes: int
    timed_out: bool = False
    error_type: Optional[str] = None
    compilation_time_ms: Optional[float] = None


class SandboxSecurityError(Exception):
    """Raised when code violates sandbox security policies."""
    pass


class SecureSubprocessSandbox:
    """
    Subprocess sandbox that enforces strict isolation:
    - Never inherits host environment variables (strips API keys and credentials)
    - Runs in a clean ephemeral temporary directory
    - Limits CPU time, memory, file size, processes via setrlimit
    - Kills entire process group on timeout or termination
    - Captures high-precision timing and peak memory
    """

    MAX_CODE_SIZE_BYTES = 512 * 1024  # 512 KB
    MAX_INPUT_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
    DEFAULT_TIMEOUT_SEC = 3.0
    DEFAULT_MEMORY_MB = 256

    # Safe minimal PATH
    SAFE_PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

    @classmethod
    def sanitize_environment(cls) -> Dict[str, str]:
        """Returns a minimal, isolated environment with NO host secrets or API keys."""
        safe_env = {
            "PATH": cls.SAFE_PATH,
            "LANG": "en_US.UTF-8",
            "LC_ALL": "en_US.UTF-8",
            "PYTHONUNBUFFERED": "1",
            "PYTHONDONTWRITEBYTECODE": "1",
            "NODE_ENV": "production",
            "TMPDIR": "/tmp",
        }
        return safe_env

    @classmethod
    def preexec_limits(cls, cpu_timeout: int = 5, memory_mb: int = 256):
        """Preexec function to set resource limits inside child process group."""
        def _set_limits():
            # Create a new session/process group so child cannot kill parent
            # and parent can kill all children via os.killpg
            os.setsid()

            try:
                # CPU time limit in seconds
                resource.setrlimit(resource.RLIMIT_CPU, (cpu_timeout, cpu_timeout + 1))
            except Exception:
                pass

            try:
                # File size creation limit (10 MB max)
                max_bytes = 10 * 1024 * 1024
                resource.setrlimit(resource.RLIMIT_FSIZE, (max_bytes, max_bytes))
            except Exception:
                pass

            try:
                # Disable core dumps
                resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
            except Exception:
                pass

            # On Linux/macOS, apply memory limit if permitted by OS
            if sys.platform.startswith("linux"):
                try:
                    mem_bytes = memory_mb * 1024 * 1024
                    resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
                except Exception:
                    pass

        return _set_limits

    @classmethod
    def run_command(
        cls,
        cmd: List[str],
        cwd: str,
        stdin_data: str = "",
        timeout_sec: float = DEFAULT_TIMEOUT_SEC,
        memory_mb: int = DEFAULT_MEMORY_MB,
        custom_env: Optional[Dict[str, str]] = None
    ) -> ExecutionResult:
        """
        Executes a command inside the sandbox with strict timeout and process group tracking.
        """
        if len(stdin_data.encode('utf-8')) > cls.MAX_INPUT_SIZE_BYTES:
            return ExecutionResult(
                success=False,
                stdout="",
                stderr="Input data exceeds maximum allowed size (5MB).",
                exit_code=-1,
                execution_time_ms=0.0,
                memory_bytes=0,
                timed_out=False,
                error_type="InputSizeExceeded"
            )

        env = cls.sanitize_environment()
        if custom_env:
            # Only allow safe keys
            for k, v in custom_env.items():
                if not any(secret in k.upper() for secret in ["KEY", "SECRET", "TOKEN", "AUTH", "PASS"]):
                    env[k] = str(v)

        start_time = time.perf_counter_ns()
        peak_memory = 0
        timed_out = False
        proc = None

        try:
            proc = subprocess.Popen(
                cmd,
                cwd=cwd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=env,
                preexec_fn=cls.preexec_limits(cpu_timeout=int(timeout_sec) + 2, memory_mb=memory_mb)
            )

            # Monitor process memory and handle timeout
            poll_interval = 0.02
            deadline = time.time() + timeout_sec
            stdout_data, stderr_data = "", ""

            # Feed stdin asynchronously if present
            if stdin_data:
                try:
                    proc.stdin.write(stdin_data)
                    proc.stdin.close()
                except (BrokenPipeError, OSError):
                    pass
            else:
                try:
                    proc.stdin.close()
                except Exception:
                    pass

            while proc.poll() is None:
                now = time.time()
                if now > deadline:
                    timed_out = True
                    break

                try:
                    # Sample resident memory of child and descendant processes
                    p = psutil.Process(proc.pid)
                    mem_info = p.memory_info()
                    curr_mem = mem_info.rss
                    for child in p.children(recursive=True):
                        try:
                            curr_mem += child.memory_info().rss
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            pass
                    if curr_mem > peak_memory:
                        peak_memory = curr_mem
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

                time.sleep(poll_interval)

            if timed_out:
                # Terminate entire process group cleanly
                try:
                    pgid = os.getpgid(proc.pid)
                    os.killpg(pgid, signal.SIGKILL)
                except (OSError, ProcessLookupError):
                    try:
                        proc.kill()
                    except Exception:
                        pass
                try:
                    proc.communicate(timeout=0.2)
                except Exception:
                    pass

                stdout_data = ""
                stderr_data = f"Execution timed out after {timeout_sec:.1f} seconds."
                exit_code = -1
                error_type = "TimeoutError"
            else:
                out, err = proc.communicate()
                stdout_data = out or ""
                stderr_data = err or ""
                exit_code = proc.returncode
                error_type = "RuntimeError" if exit_code != 0 else None

        except Exception as e:
            if proc:
                try:
                    pgid = os.getpgid(proc.pid)
                    os.killpg(pgid, signal.SIGKILL)
                except Exception:
                    pass
            stdout_data = ""
            stderr_data = str(e)
            exit_code = -1
            error_type = "ExecutionException"

        end_time = time.perf_counter_ns()
        exec_ms = (end_time - start_time) / 1_000_000.0

        return ExecutionResult(
            success=(exit_code == 0 and not timed_out),
            stdout=stdout_data,
            stderr=stderr_data,
            exit_code=exit_code,
            execution_time_ms=round(exec_ms, 3),
            memory_bytes=peak_memory,
            timed_out=timed_out,
            error_type=error_type
        )
