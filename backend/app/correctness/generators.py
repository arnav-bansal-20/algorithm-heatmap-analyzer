"""
Problem-specific test case generators for correctness verification.
Generates comprehensive suites covering normal, edge, duplicate, empty, and boundary conditions.
"""

import random
from typing import List, Dict, Any
from app.correctness.oracle import ProblemOracle

class TestSuiteGenerator:
    @staticmethod
    def generate_sorting_suite() -> List[Dict[str, Any]]:
        tests = []
        cases = [
            ("TC-1: Normal Input", [64, 34, 25, 12, 22, 11, 90]),
            ("TC-2: Empty Array", []),
            ("TC-3: Single Element", [42]),
            ("TC-4: All Duplicates", [7, 7, 7, 7, 7]),
            ("TC-5: Already Sorted", [1, 2, 3, 4, 5, 6, 7, 8]),
            ("TC-6: Reverse Sorted", [9, 8, 7, 6, 5, 4, 3, 2, 1]),
            ("TC-7: Negative Numbers", [-5, 10, -20, 0, 15, -1]),
            ("TC-8: Random Array", [random.randint(1, 1000) for _ in range(50)]),
            ("TC-9: Duplicate-Heavy", [1, 3, 2, 3, 1, 2, 3, 1, 2, 3, 2, 1]),
            ("TC-10: Moderate Size", [random.randint(-10000, 10000) for _ in range(200)])
        ]
        for name, arr in cases:
            expected = ProblemOracle.solve_sorting(arr)
            stdin_str = f"{len(arr)}\n" + " ".join(map(str, arr)) if arr else "0\n"
            tests.append({
                "id": name,
                "input": arr,
                "stdin": stdin_str,
                "expected": expected,
                "category": "sorting"
            })
        return tests

    @staticmethod
    def generate_searching_suite() -> List[Dict[str, Any]]:
        tests = []
        cases = [
            ("TC-1: Key in Middle", [10, 20, 30, 40, 50], 30),
            ("TC-2: Key at Beginning", [5, 15, 25, 35], 5),
            ("TC-3: Key at End", [1, 2, 4, 8, 16], 16),
            ("TC-4: Key Not Present", [2, 4, 6, 8, 10], 7),
            ("TC-5: Empty Array", [], 10),
            ("TC-6: Single Element Found", [99], 99),
            ("TC-7: Single Element Not Found", [99], 100),
            ("TC-8: Duplicates (Find Any Valid)", [1, 3, 3, 3, 7], 3),
            ("TC-9: Negative Key", [-50, -25, 0, 25, 50], -25),
            ("TC-10: Large Search", list(range(0, 200, 2)), 144)
        ]
        for name, arr, key in cases:
            expected = ProblemOracle.solve_searching(arr, key)
            stdin_str = f"{len(arr)} {key}\n" + " ".join(map(str, arr)) if arr else f"0 {key}\n"
            tests.append({
                "id": name,
                "input": {"arr": arr, "key": key},
                "stdin": stdin_str,
                "expected": expected,
                "category": "searching"
            })
        return tests

    @staticmethod
    def generate_string_suite() -> List[Dict[str, Any]]:
        tests = []
        cases = [
            ("TC-1: Simple Match", "ABABDABACDABABCABAB", "ABABCABAB"),
            ("TC-2: Multiple Occurrences", "AABAACAADAABAABA", "AABA"),
            ("TC-3: Pattern Not Found", "HELLO WORLD", "BYE"),
            ("TC-4: Pattern Equals Text", "ANTIGRAVITY", "ANTIGRAVITY"),
            ("TC-5: Single Character Match", "BANANA", "A"),
            ("TC-6: Empty Pattern", "ABCDEF", ""),
            ("TC-7: Repeating Characters", "AAAAAAA", "AA"),
            ("TC-8: Pattern Longer Than Text", "CAT", "CATAPULT")
        ]
        for name, text, pat in cases:
            expected = ProblemOracle.solve_string_matching(text, pat)
            stdin_str = f"{text}\n{pat}\n"
            tests.append({
                "id": name,
                "input": {"text": text, "pattern": pat},
                "stdin": stdin_str,
                "expected": expected,
                "category": "string"
            })
        return tests

    @staticmethod
    def generate_knapsack_suite() -> List[Dict[str, Any]]:
        tests = []
        cases = [
            ("TC-1: Classic 3-Item", [60, 100, 120], [10, 20, 30], 50),
            ("TC-2: Capacity Zero", [10, 20], [5, 10], 0),
            ("TC-3: No Items Fit", [100, 200], [50, 60], 30),
            ("TC-4: All Items Fit", [10, 20, 30], [1, 2, 3], 10),
            ("TC-5: Single Item Fits", [50], [10], 15),
            ("TC-6: Single Item Too Heavy", [50], [20], 10),
            ("TC-7: Greedy Pitfall", [10, 10, 10, 25], [5, 5, 5, 14], 15)
        ]
        for name, vals, wts, cap in cases:
            expected = ProblemOracle.solve_knapsack(vals, wts, cap)
            stdin_str = f"{len(vals)} {cap}\n" + " ".join(map(str, vals)) + "\n" + " ".join(map(str, wts)) + "\n"
            tests.append({
                "id": name,
                "input": {"values": vals, "weights": wts, "capacity": cap},
                "stdin": stdin_str,
                "expected": expected,
                "category": "advanced"
            })
        return tests

    @staticmethod
    def generate_n_queens_suite() -> List[Dict[str, Any]]:
        tests = []
        cases = [
            ("TC-1: N=1 (Trivial)", 1),
            ("TC-2: N=2 (No Solution)", 2),
            ("TC-3: N=3 (No Solution)", 3),
            ("TC-4: N=4 (2 Solutions)", 4),
            ("TC-5: N=5 (10 Solutions)", 5),
            ("TC-6: N=6 (4 Solutions)", 6),
            ("TC-7: N=8 (Standard 92 Solutions)", 8)
        ]
        for name, n in cases:
            expected = ProblemOracle.solve_n_queens(n)
            stdin_str = f"{n}\n"
            tests.append({
                "id": name,
                "input": {"n": n},
                "stdin": stdin_str,
                "expected": expected,
                "category": "advanced"
            })
        return tests

    @classmethod
    def get_suite_for_category(cls, category: str) -> List[Dict[str, Any]]:
        cat = category.lower().strip()
        if "sort" in cat:
            return cls.generate_sorting_suite()
        elif "search" in cat:
            return cls.generate_searching_suite()
        elif "string" in cat:
            return cls.generate_string_suite()
        elif "knapsack" in cat:
            return cls.generate_knapsack_suite()
        elif "queen" in cat:
            return cls.generate_n_queens_suite()
        # Default to sorting suite
        return cls.generate_sorting_suite()

