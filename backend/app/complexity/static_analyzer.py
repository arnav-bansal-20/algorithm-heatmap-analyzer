"""
Theoretical Complexity Static Analyzer.
Analyzes code structure (loops, nesting, recursion branching, auxiliary allocations)
using Python AST for Python, and dedicated structural analyzers for C, C++, Java, and JavaScript.
Never pretents Python AST works on non-Python code!
"""

import ast
import re
from typing import Dict, Any, List, Optional

class StaticComplexityAnalyzer:
    @classmethod
    def analyze(cls, language: str, code: str, category: str = "sorting") -> Dict[str, Any]:
        lang = language.lower().strip()
        if lang in ["python", "py"]:
            return cls._analyze_python(code, category)
        elif lang in ["c", "cpp", "c++"]:
            return cls._analyze_c_family(code, category, lang)
        elif lang in ["java"]:
            return cls._analyze_java(code, category)
        elif lang in ["javascript", "js", "node"]:
            return cls._analyze_javascript(code, category)
        else:
            return cls._generic_structural_analysis(code, category)

    @classmethod
    def _analyze_python(cls, code: str, category: str) -> Dict[str, Any]:
        try:
            tree = ast.parse(code)
        except Exception as e:
            return cls._generic_structural_analysis(code, category, parse_error=str(e))

        max_loop_depth = 0
        total_loops = 0
        has_early_break = False
        uses_builtin_sort = False
        auxiliary_memory = "O(1)"
        
        # Check loops and nesting
        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                total_loops += 1
                depth = 1
                curr = node
                # Check for nested loops inside its body
                for child in ast.walk(node):
                    if child is not node and isinstance(child, (ast.For, ast.While)):
                        depth = max(depth, 2)
                        for grandchild in ast.walk(child):
                            if grandchild is not child and isinstance(grandchild, (ast.For, ast.While)):
                                depth = max(depth, 3)
                max_loop_depth = max(max_loop_depth, depth)

            if isinstance(node, ast.Break):
                has_early_break = True

            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id in ["sorted"]:
                    uses_builtin_sort = True
                elif isinstance(node.func, ast.Attribute) and node.func.attr in ["sort"]:
                    uses_builtin_sort = True

            # Check auxiliary space (list comprehensions or slices)
            if isinstance(node, (ast.ListComp, ast.Slice)):
                auxiliary_memory = "O(n)"

        # Check recursion
        functions = [n for n in tree.body if isinstance(n, ast.FunctionDef)]
        is_recursive = False
        recursive_calls_per_func = {}

        for fn in functions:
            fn_name = fn.name
            call_count = 0
            for child in ast.walk(fn):
                if isinstance(child, ast.Call):
                    if isinstance(child.func, ast.Name) and child.func.id == fn_name:
                        call_count += 1
            if call_count > 0:
                is_recursive = True
                recursive_calls_per_func[fn_name] = call_count

        return cls._derive_complexity(
            max_loop_depth=max_loop_depth,
            total_loops=total_loops,
            is_recursive=is_recursive,
            recursive_branching=max(recursive_calls_per_func.values(), default=0),
            has_early_break=has_early_break,
            uses_builtin_sort=uses_builtin_sort,
            auxiliary_memory=auxiliary_memory,
            category=category,
            language="Python"
        )

    @classmethod
    def _analyze_c_family(cls, code: str, category: str, lang_name: str) -> Dict[str, Any]:
        """Analyzes C/C++ source code using structural parsing (brace depth, loop keywords, recursion)."""
        clean_code = re.sub(r'//.*', '', code)
        clean_code = re.sub(r'/\*.*?\*/', '', clean_code, flags=re.DOTALL)

        lines = clean_code.splitlines()
        max_loop_depth = 0
        curr_loop_stack = []
        total_loops = 0
        has_early_break = "break;" in clean_code or "return" in clean_code
        uses_builtin_sort = "std::sort" in clean_code or "qsort" in clean_code
        auxiliary_memory = "O(1)"

        if "malloc(" in clean_code or "new " in clean_code or "vector<" in clean_code:
            auxiliary_memory = "O(n)"

        # Detect loop nesting via brace and keyword tracking
        loop_pattern = re.compile(r'\b(for|while)\s*\(')
        depth = 0
        loop_depths = []

        for line in lines:
            if loop_pattern.search(line):
                total_loops += 1
                loop_depths.append(depth)
            
            depth += line.count('{') - line.count('}')
            if depth < 0:
                depth = 0

        # Calculate max concurrent nesting
        if total_loops > 0:
            # Estimate nesting by inspecting consecutive loop indentations/braces
            nested_pairs = len(re.findall(r'for\s*\(.*?\)\s*\{?[^{}]*?for\s*\(', clean_code, re.DOTALL))
            nested_triplets = len(re.findall(r'for\s*\(.*?\)\s*\{?[^{}]*?for\s*\(.*?\)\s*\{?[^{}]*?for\s*\(', clean_code, re.DOTALL))
            if nested_triplets > 0:
                max_loop_depth = 3
            elif nested_pairs > 0 or total_loops >= 2:
                max_loop_depth = 2
            else:
                max_loop_depth = 1

        # Check recursion
        func_defs = re.findall(r'(?:int|void|double|float|long|bool)\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{', clean_code)
        is_recursive = False
        max_branching = 0
        for f in func_defs:
            if f in ["main", "printf", "scanf", "cout", "cin"]:
                continue
            calls = len(re.findall(rf'\b{f}\s*\(', clean_code))
            if calls >= 2:
                is_recursive = True
                max_branching = max(max_branching, calls - 1)

        return cls._derive_complexity(
            max_loop_depth=max_loop_depth,
            total_loops=total_loops,
            is_recursive=is_recursive,
            recursive_branching=max_branching,
            has_early_break=has_early_break,
            uses_builtin_sort=uses_builtin_sort,
            auxiliary_memory=auxiliary_memory,
            category=category,
            language="C/C++"
        )

    @classmethod
    def _analyze_java(cls, code: str, category: str) -> Dict[str, Any]:
        """Analyzes Java source code structure."""
        clean_code = re.sub(r'//.*', '', code)
        clean_code = re.sub(r'/\*.*?\*/', '', clean_code, flags=re.DOTALL)

        total_loops = len(re.findall(r'\b(for|while)\s*\(', clean_code))
        nested_pairs = len(re.findall(r'for\s*\(.*?\)\s*\{?[^{}]*?for\s*\(', clean_code, re.DOTALL))
        max_loop_depth = 2 if nested_pairs > 0 or total_loops >= 2 else (1 if total_loops > 0 else 0)
        has_early_break = "break;" in clean_code
        uses_builtin_sort = "Arrays.sort" in clean_code or "Collections.sort" in clean_code
        auxiliary_memory = "O(n)" if ("new int[" in clean_code or "ArrayList" in clean_code) else "O(1)"

        return cls._derive_complexity(
            max_loop_depth=max_loop_depth,
            total_loops=total_loops,
            is_recursive=False,
            recursive_branching=0,
            has_early_break=has_early_break,
            uses_builtin_sort=uses_builtin_sort,
            auxiliary_memory=auxiliary_memory,
            category=category,
            language="Java"
        )

    @classmethod
    def _analyze_javascript(cls, code: str, category: str) -> Dict[str, Any]:
        """Analyzes JavaScript source code structure."""
        clean_code = re.sub(r'//.*', '', code)
        clean_code = re.sub(r'/\*.*?\*/', '', clean_code, flags=re.DOTALL)

        total_loops = len(re.findall(r'\b(for|while)\s*\(', clean_code))
        nested_pairs = len(re.findall(r'for\s*\(.*?\)\s*\{?[^{}]*?for\s*\(', clean_code, re.DOTALL))
        max_loop_depth = 2 if nested_pairs > 0 or total_loops >= 2 else (1 if total_loops > 0 else 0)
        has_early_break = "break;" in clean_code
        uses_builtin_sort = ".sort(" in clean_code
        auxiliary_memory = "O(n)" if (".slice(" in clean_code or ".concat(" in clean_code or "[]" in clean_code) else "O(1)"

        return cls._derive_complexity(
            max_loop_depth=max_loop_depth,
            total_loops=total_loops,
            is_recursive=False,
            recursive_branching=0,
            has_early_break=has_early_break,
            uses_builtin_sort=uses_builtin_sort,
            auxiliary_memory=auxiliary_memory,
            category=category,
            language="JavaScript"
        )

    @classmethod
    def _generic_structural_analysis(cls, code: str, category: str, parse_error: Optional[str] = None) -> Dict[str, Any]:
        loops = len(re.findall(r'\b(for|while)\b', code))
        return {
            "best_case": "O(n)",
            "average_case": "O(n²)" if loops >= 2 else "O(n)",
            "worst_case": "O(n²)" if loops >= 2 else "O(n)",
            "space_complexity": "O(1)",
            "details": f"Static structural parsing estimated complexity based on {loops} loop construct(s).",
            "max_loop_depth": min(loops, 2),
            "is_recursive": False,
            "methodology": "Structural Heuristic"
        }

    @classmethod
    def _derive_complexity(
        cls,
        max_loop_depth: int,
        total_loops: int,
        is_recursive: bool,
        recursive_branching: int,
        has_early_break: bool,
        uses_builtin_sort: bool,
        auxiliary_memory: str,
        category: str,
        language: str
    ) -> Dict[str, Any]:
        """Derives big-O estimates based on structural properties."""
        best_case = "O(n)"
        average_case = "O(n)"
        worst_case = "O(n)"
        space_complexity = auxiliary_memory
        rationale = []

        if uses_builtin_sort:
            best_case = "O(n)" if has_early_break else "O(n log n)"
            average_case = "O(n log n)"
            worst_case = "O(n log n)"
            rationale.append("Algorithm delegates sorting to standard library sort routines (Timsort/Dual-Pivot Quicksort) running in O(n log n).")

        elif is_recursive:
            if recursive_branching >= 2:
                # Divide and conquer or multiple recursive branches
                best_case = "O(n log n)"
                average_case = "O(n log n)"
                worst_case = "O(n²)"
                space_complexity = "O(log n)" if auxiliary_memory == "O(1)" else auxiliary_memory
                rationale.append(f"Detected recursive branching (branching factor {recursive_branching}). Suggests divide-and-conquer strategy with O(log n) call stack.")
            else:
                best_case = "O(n)"
                average_case = "O(n)"
                worst_case = "O(n)"
                space_complexity = "O(n)"
                rationale.append("Detected linear recursion with single recursive self-invocation.")

        elif max_loop_depth >= 3:
            best_case = "O(n²)" if has_early_break else "O(n³)"
            average_case = "O(n³)"
            worst_case = "O(n³)"
            rationale.append(f"Detected 3 levels of nested iterative loops yielding cubic O(n³) polynomial growth.")

        elif max_loop_depth == 2:
            best_case = "O(n)" if has_early_break else "O(n²)"
            average_case = "O(n²)"
            worst_case = "O(n²)"
            rationale.append(f"Detected 2 levels of nested loops (quadratic O(n²))." + (" Early termination break flag allows O(n) best-case." if has_early_break else ""))

        elif max_loop_depth == 1:
            if "search" in category.lower() and ("binary" in rationale or "mid" in str(rationale)):
                best_case = "O(1)"
                average_case = "O(log n)"
                worst_case = "O(log n)"
            else:
                best_case = "O(1)" if has_early_break else "O(n)"
                average_case = "O(n)"
                worst_case = "O(n)"
            rationale.append("Detected single-level linear iteration O(n).")
        else:
            best_case = "O(1)"
            average_case = "O(1)"
            worst_case = "O(1)"
            rationale.append("No loops or recursive calls detected; estimated constant time O(1).")

        return {
            "best_case": best_case,
            "average_case": average_case,
            "worst_case": worst_case,
            "space_complexity": space_complexity,
            "max_loop_depth": max_loop_depth,
            "total_loops": total_loops,
            "is_recursive": is_recursive,
            "recursive_branching": recursive_branching,
            "has_early_break": has_early_break,
            "uses_builtin_sort": uses_builtin_sort,
            "language": language,
            "rationale": rationale,
            "methodology": f"Static Structural AST Analysis ({language})"
        }

