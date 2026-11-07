"""
Correctness Validation Engine.
Runs the student code across comprehensive test suites and compares outputs with problem oracles.
"""

import json
import re
from typing import Dict, Any, List, Optional
from app.sandbox import execute_code
from app.correctness.generators import TestSuiteGenerator

class CorrectnessValidator:
    @staticmethod
    def parse_student_output(raw_output: str, expected: Any, category: str) -> Any:
        """Parses stdout from student code into matching Python data structures."""
        cleaned = raw_output.strip()
        if not cleaned:
            return [] if isinstance(expected, list) else None

        # If expected is a list (e.g., sorting, string matches)
        if isinstance(expected, list):
            if cleaned == "[]":
                return []
            try:
                parsed = json.loads(cleaned)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
            ints = re.findall(r'-?\d+', cleaned)
            return [int(x) for x in ints]

        # 1. Try JSON parsing
        try:
            parsed = json.loads(cleaned)
            return parsed
        except Exception:
            pass

        # 2. If expected is a single integer (e.g., searching, knapsack, n_queens)
        if isinstance(expected, int):
            ints = re.findall(r'-?\d+', cleaned)
            if ints:
                return int(ints[-1])
            return None

        # 3. If expected is a float
        if isinstance(expected, float):
            floats = re.findall(r'-?\d+(?:\.\d+)?', cleaned)
            if floats:
                return float(floats[-1])
            return None

        return cleaned

    @staticmethod
    def outputs_match(actual: Any, expected: Any, tolerance: float = 1e-4) -> bool:
        """Compares actual and expected values with type-safety and float tolerance."""
        if actual is None and expected is not None:
            return False

        if isinstance(expected, list) and isinstance(actual, list):
            if len(actual) != len(expected):
                return False
            for a, e in zip(actual, expected):
                if not CorrectnessValidator.outputs_match(a, e, tolerance):
                    return False
            return True

        if isinstance(expected, float) and (isinstance(actual, (int, float))):
            return abs(float(actual) - expected) <= tolerance

        if isinstance(expected, int) and isinstance(actual, (int, float)):
            return int(actual) == expected

        return str(actual).strip() == str(expected).strip()

    @staticmethod
    def wrap_python_if_needed(code: str, category: str) -> str:
        """If user code contains a function definition like def sort(...) or def solve(...)
        but no stdin read, wrap it with a lightweight standard I/O driver."""
        if "sys.stdin" in code or "input(" in code:
            return code

        # Check for function definition
        func_match = re.search(r'def\s+([A-Za-z0-9_]+)\s*\(', code)
        if not func_match:
            return code

        func_name = func_match.group(1)

        cat = category.lower()
        if "sort" in cat:
            wrapper = f"""
import sys, json

{code}

if __name__ == '__main__':
    lines = sys.stdin.read().split()
    if not lines or len(lines) < 1:
        print("[]")
    else:
        n = int(lines[0])
        arr = [int(x) for x in lines[1:n+1]]
        res = {func_name}(arr)
        if res is None:
            res = arr
        print(" ".join(map(str, res)))
"""
            return wrapper
        elif "search" in cat:
            wrapper = f"""
import sys

{code}

if __name__ == '__main__':
    lines = sys.stdin.read().split()
    if not lines or len(lines) < 2:
        print(-1)
    else:
        n = int(lines[0])
        key = int(lines[1])
        arr = [int(x) for x in lines[2:n+2]]
        res = {func_name}(arr, key)
        print(res if res is not None else -1)
"""
            return wrapper
        elif "string" in cat:
            wrapper = f"""
import sys

{code}

if __name__ == '__main__':
    raw = sys.stdin.read().splitlines()
    text = raw[0] if len(raw) > 0 else ""
    pattern = raw[1] if len(raw) > 1 else ""
    res = {func_name}(text, pattern)
    if isinstance(res, list):
        print(" ".join(map(str, res)))
    else:
        print(res if res is not None else "")
"""
            return wrapper
        elif "knapsack" in cat:
            wrapper = f"""
import sys

{code}

if __name__ == '__main__':
    lines = sys.stdin.read().split()
    if len(lines) >= 2:
        n = int(lines[0])
        cap = int(lines[1])
        vals = [int(x) for x in lines[2:n+2]]
        wts = [int(x) for x in lines[n+2:2*n+2]]
        res = {func_name}(vals, wts, cap)
        print(res)
    else:
        print(0)
"""
            return wrapper
        elif "queen" in cat:
            wrapper = f"""
import sys

{code}

if __name__ == '__main__':
    lines = sys.stdin.read().split()
    n = int(lines[0]) if lines else 4
    res = {func_name}(n)
    print(res)
"""
            return wrapper

        return code

    @classmethod
    def validate(
        cls,
        language: str,
        code: str,
        category: str,
        timeout_per_test_sec: float = 2.0
    ) -> Dict[str, Any]:
        """Runs the validation test suite on the submitted algorithm."""
        suite = TestSuiteGenerator.get_suite_for_category(category)

        # Prepare code
        executable_code = code
        if language.lower() in ["python", "py"]:
            executable_code = cls.wrap_python_if_needed(code, category)

        test_results = []
        passed_count = 0
        total_time_ms = 0.0

        for test in suite:
            t_id = test["id"]
            expected = test["expected"]
            stdin_data = test["stdin"]

            exec_res = execute_code(
                language=language,
                code=executable_code,
                stdin_data=stdin_data,
                timeout_sec=timeout_per_test_sec
            )

            total_time_ms += exec_res.execution_time_ms

            if not exec_res.success:
                err_msg = exec_res.stderr or f"Exit code {exec_res.exit_code}"
                test_results.append({
                    "test_id": t_id,
                    "passed": False,
                    "expected": expected,
                    "actual": None,
                    "error": err_msg,
                    "execution_time_ms": exec_res.execution_time_ms,
                    "status": "Runtime Error" if not exec_res.timed_out else "Timeout"
                })
                continue

            parsed_actual = cls.parse_student_output(exec_res.stdout, expected, category)
            is_match = cls.outputs_match(parsed_actual, expected)

            if is_match:
                passed_count += 1

            test_results.append({
                "test_id": t_id,
                "passed": is_match,
                "expected": expected,
                "actual": parsed_actual,
                "error": None if is_match else f"Output mismatch. Expected: {expected}, Got: {parsed_actual}",
                "execution_time_ms": exec_res.execution_time_ms,
                "status": "Passed" if is_match else "Wrong Answer"
            })

        total_tests = len(suite)
        is_all_correct = (passed_count == total_tests)
        correctness_pct = round((passed_count / total_tests) * 100.0, 1) if total_tests > 0 else 0.0

        return {
            "is_correct": is_all_correct,
            "passed_tests": passed_count,
            "total_tests": total_tests,
            "correctness_percentage": correctness_pct,
            "total_execution_time_ms": round(total_time_ms, 3),
            "test_cases": test_results
        }
