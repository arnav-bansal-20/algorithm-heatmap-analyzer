"""
Unified sandbox interface for multi-language execution.
"""

from typing import Dict, Any
from app.sandbox.runner import ExecutionResult, SecureSubprocessSandbox
from app.sandbox.python_runner import PythonRunner
from app.sandbox.c_runner import CRunner
from app.sandbox.cpp_runner import CppRunner
from app.sandbox.java_runner import JavaRunner
from app.sandbox.js_runner import JsRunner

RUNNERS = {
    "python": PythonRunner,
    "py": PythonRunner,
    "c": CRunner,
    "cpp": CppRunner,
    "c++": CppRunner,
    "java": JavaRunner,
    "javascript": JsRunner,
    "js": JsRunner,
    "node": JsRunner,
}

def execute_code(
    language: str,
    code: str,
    stdin_data: str = "",
    timeout_sec: float = 3.0,
    memory_mb: int = 256
) -> ExecutionResult:
    lang_key = language.lower().strip()
    runner = RUNNERS.get(lang_key)
    if not runner:
        return ExecutionResult(
            success=False,
            stdout="",
            stderr=f"Unsupported language: '{language}'. Supported: Python, C, C++, Java, JavaScript.",
            exit_code=-1,
            execution_time_ms=0.0,
            memory_bytes=0,
            error_type="UnsupportedLanguage"
        )

    return runner.execute(code, stdin_data, timeout_sec, memory_mb)

__all__ = [
    "execute_code",
    "ExecutionResult",
    "SecureSubprocessSandbox",
    "PythonRunner",
    "CRunner",
    "CppRunner",
    "JavaRunner",
    "JsRunner"
]

