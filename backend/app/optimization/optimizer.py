"""
Algorithm Optimization Engine.
Identifies performance bottlenecks in student code, provides actionable explanations,
safely generates optimized versions, and calculates expected theoretical improvements.
Never modifies original student submissions automatically.
"""

import re
from typing import Dict, Any, List

class CodeOptimizer:
    @classmethod
    def generate_optimizations(cls, language: str, code: str, category: str = "sorting") -> Dict[str, Any]:
        lang = language.lower()
        cat = category.lower()

        optimizations = []
        optimized_code = code
        theoretical_improvement = "None detected"

        if "sort" in cat:
            # 1. Bubble Sort missing early exit flag
            if ("for" in code or "while" in code) and ("arr[j] > arr[j + 1]" in code or "arr[j] > arr[j+1]" in code):
                if "swapped" not in code and "break" not in code:
                    optimizations.append({
                        "issue": "Unconditional O(n²) Execution on Sorted Data",
                        "location": "Inner comparison loop",
                        "explanation": "The current implementation iterates through all comparisons even if the array is already sorted. Adding a 'swapped' boolean flag enables the algorithm to terminate in O(n) best-case time.",
                        "suggested_fix": "Add a 'swapped = False' flag before the inner loop and break early if no swaps occurred.",
                        "theoretical_delta": "Best-case improves from O(n²) to O(n). Average-case improves by ~20-30% on nearly-sorted data."
                    })
                    theoretical_improvement = "Best-case: O(n²) -> O(n); Reduced constant overhead on partially ordered inputs."

                    # Generate safely optimized version if Python
                    if lang in ["python", "py"]:
                        optimized_code = """def optimized_sort(arr):
    \"\"\"Optimized sorting with early termination flag.\"\"\"
    n = len(arr)
    arr = list(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr
"""
            # 2. Quadratic Sort vs O(n log n) recommendation
            if "quick" not in code.lower() and "merge" not in code.lower() and "heap" not in code.lower() and "sort(" not in code:
                optimizations.append({
                    "issue": "Quadratic Algorithm Selected for Large Datasets",
                    "location": "Core sorting logic",
                    "explanation": "Quadratic sorting algorithms (Bubble/Selection/Insertion) scale with O(n²), resulting in exponential latency on inputs over 10,000 items. Migrating to a divide-and-conquer approach (Merge Sort or Quick Sort) reduces asymptotic operations to O(n log n).",
                    "suggested_fix": "Implement 3-way Quick Sort or Merge Sort for guaranteed O(n log n) scalability.",
                    "theoretical_delta": "Complexity improves from O(n²) to O(n log n). For n=100,000, operations decrease from 10,000,000,000 to ~1,660,000 (over 6000x faster)."
                })

        elif "search" in cat:
            if "linear" in code.lower() or "for i in range" in code:
                optimizations.append({
                    "issue": "Linear Search O(n) on Monotonic / Pre-Sorted Data",
                    "location": "Sequential scan loop",
                    "explanation": "Linear search inspects every element one by one. If data is sorted or can be pre-sorted, Binary Search achieves logarithmic time O(log n).",
                    "suggested_fix": "Use Binary Search with low, high, and middle pointers.",
                    "theoretical_delta": "Complexity improves from O(n) to O(log n). Maximum comparisons on n=1,000,000 decrease from 1,000,000 to only 20."
                })
                if lang in ["python", "py"]:
                    optimized_code = """def binary_search(arr, key):
    \"\"\"Optimized logarithmic search O(log n).\"\"\"
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == key:
            return mid
        elif arr[mid] < key:
            low = mid + 1
        else:
            high = mid - 1
    return -1
"""
                    theoretical_improvement = "Average & Worst Case: O(n) -> O(log n)"

        return {
            "has_optimizations": len(optimizations) > 0,
            "issues_count": len(optimizations),
            "original_code": code,
            "optimized_code": optimized_code if optimized_code != code else None,
            "theoretical_improvement": theoretical_improvement,
            "optimizations": optimizations
        }

