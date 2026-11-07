"""
Code Quality Analysis Engine.
Evaluates student source code across 5 weighted dimensions with a defined scoring methodology:
1. Readability & Structure (20 pts)
2. Naming Conventions (20 pts)
3. Algorithmic Efficiency & Loop Economy (20 pts)
4. Memory & Resource Discipline (20 pts)
5. Robustness & Edge-Case Safety (20 pts)
Avoids arbitrary scores by documenting every deduction with specific code evidence and actionable suggestions.
"""

import re
from typing import Dict, Any, List

class CodeQualityAnalyzer:
    @classmethod
    def analyze(cls, code: str, language: str, category: str = "sorting") -> Dict[str, Any]:
        lines = code.splitlines()
        total_lines = len(lines)
        clean_lines = [l.strip() for l in lines if l.strip() and not l.strip().startswith(("#", "//", "/*", "*"))]

        findings = []
        
        # 1. Readability & Structure (Max 20 pts)
        readability_score = 20
        has_comments = any(line.strip().startswith(("#", "//", "/*", "*")) for line in lines)
        if not has_comments and total_lines > 10:
            readability_score -= 5
            findings.append({
                "dimension": "Readability",
                "severity": "info",
                "penalty": 5,
                "title": "Missing Code Documentation",
                "message": "Adding docstrings or comments explaining key algorithm steps enhances maintainability."
            })

        long_lines = [i + 1 for i, l in enumerate(lines) if len(l) > 100]
        if long_lines:
            penalty = min(5, len(long_lines) * 2)
            readability_score -= penalty
            findings.append({
                "dimension": "Readability",
                "severity": "minor",
                "penalty": penalty,
                "title": "Long Lines Exceeding 100 Characters",
                "message": f"Lines {long_lines[:3]} exceed standard length conventions; consider breaking complex statements."
            })

        # 2. Naming Conventions (Max 20 pts)
        naming_score = 20
        # Identify single letter identifiers outside i, j, k, n, u, v, w
        identifiers = re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b', code)
        bad_singles = [id_ for id_ in identifiers if len(id_) == 1 and id_ not in ['i', 'j', 'k', 'n', 'u', 'v', 'w', 'r', 'c', 't', 'x', 'y', 'z', '_']]
        if bad_singles:
            unique_bad = list(set(bad_singles))
            penalty = min(8, len(unique_bad) * 3)
            naming_score -= penalty
            findings.append({
                "dimension": "Naming Conventions",
                "severity": "minor",
                "penalty": penalty,
                "title": f"Single-Letter Variable Names: {unique_bad[:4]}",
                "message": "Use descriptive variable names (e.g., 'pivot_idx', 'left_bound') instead of ambiguous single letters."
            })

        # 3. Algorithmic Efficiency & Loop Economy (Max 20 pts)
        efficiency_score = 20
        # Look for bubble sort missing swapped early break flag
        if "sort" in category.lower() and ("for" in code or "while" in code):
            has_two_loops = len(re.findall(r'\b(for|while)\b', code)) >= 2
            has_break = "break" in code or "swapped" in code
            if has_two_loops and not has_break:
                efficiency_score -= 8
                findings.append({
                    "dimension": "Efficiency",
                    "severity": "major",
                    "penalty": 8,
                    "title": "Unoptimized Nested Loop (No Early Exit)",
                    "message": "The inner sorting loop does not track whether swaps occurred, preventing O(n) best-case execution on already sorted inputs."
                })

        # Unnecessary repeated len() call inside tight loop condition in Python
        if language.lower() in ["python", "py"] and "range(len(" in code and "range(0, len(" in code:
            efficiency_score -= 3
            findings.append({
                "dimension": "Efficiency",
                "severity": "minor",
                "penalty": 3,
                "title": "Redundant Range Call",
                "message": "Repeated range(0, len(...)) calls can be simplified or cached in a variable 'n'."
            })

        # 4. Memory & Resource Discipline (Max 20 pts)
        memory_score = 20
        if language.lower() in ["python", "py"]:
            # Repeated slicing inside loops creates redundant memory copies
            slices_in_loops = re.findall(r'for\s+.*?:[^\n]*?\[\s*:\s*[a-zA-Z0-9_]+\]', code)
            if slices_in_loops:
                memory_score -= 6
                findings.append({
                    "dimension": "Memory",
                    "severity": "minor",
                    "penalty": 6,
                    "title": "Array Slicing Inside Iteration",
                    "message": "List slicing creates a shallow copy in memory each time. Passing indices or views avoids unnecessary allocations."
                })
        elif language.lower() in ["c", "cpp"]:
            if "malloc(" in code and "free(" not in code:
                memory_score -= 10
                findings.append({
                    "dimension": "Memory",
                    "severity": "major",
                    "penalty": 10,
                    "title": "Missing Memory Deallocation (Potential Leak)",
                    "message": "Dynamic memory allocated via malloc() was not paired with free(), causing memory retention."
                })

        # 5. Robustness & Edge-Case Safety (Max 20 pts)
        robustness_score = 20
        has_empty_guard = any(k in code for k in ["len(arr) <= 1", "n <= 1", "n == 0", "length <= 1", "if (n <= 0)"])
        if not has_empty_guard and ("sort" in category.lower() or "search" in category.lower()):
            robustness_score -= 5
            findings.append({
                "dimension": "Robustness",
                "severity": "minor",
                "penalty": 5,
                "title": "Missing Empty / Single-Element Input Guard",
                "message": "Explicitly guarding against empty or single-element inputs at the beginning of the algorithm avoids edge-case crashes."
            })

        total_score = max(0, min(100, readability_score + naming_score + efficiency_score + memory_score + robustness_score))

        # Rating tier
        if total_score >= 90:
            rating = "Excellent"
        elif total_score >= 75:
            rating = "Good"
        elif total_score >= 60:
            rating = "Acceptable"
        elif total_score >= 45:
            rating = "Needs Improvement"
        else:
            rating = "Poor"

        return {
            "overall_score": total_score,
            "rating": rating,
            "dimensions": {
                "readability": max(0, readability_score),
                "naming_conventions": max(0, naming_score),
                "efficiency": max(0, efficiency_score),
                "memory_discipline": max(0, memory_score),
                "robustness": max(0, robustness_score)
            },
            "findings": findings,
            "methodology": "Standardized 5-Factor Rubric (20 pts per dimension: Readability, Naming, Loop Economy, Memory, Robustness)"
        }

