import time
import tracemalloc
import random
import string
import gc
import statistics
from typing import Dict, Any, List, Tuple, Optional
from app import algorithms
from app.sandbox import execute_code
from app.correctness.validator import CorrectnessValidator

# ============================================================================
# 1. DATASET GENERATION FUNCTIONS
# ============================================================================

def generate_sorting_dataset(size: int, dataset_type: str) -> List[int]:
    if dataset_type == "sorted":
        return list(range(size))
    elif dataset_type == "reverse_sorted":
        return list(range(size - 1, -1, -1))
    elif dataset_type == "nearly_sorted":
        arr = list(range(size))
        swaps = max(1, size // 10)
        for _ in range(swaps):
            idx = random.randint(0, max(0, size - 2))
            arr[idx], arr[idx + 1] = arr[idx + 1], arr[idx]
        return arr
    elif dataset_type == "duplicate_heavy":
        # Universe of only 5 distinct elements
        return [random.choice([2, 5, 11, 19, 42]) for _ in range(size)]
    elif dataset_type == "edge_cases":
        # Alternating negative, zero, extreme values
        candidates = [-1000000, 0, 1000000, -1, 1, 999999]
        return [candidates[i % len(candidates)] for i in range(size)]
    else:  # random
        return [random.randint(1, size * 10) for _ in range(size)]


def generate_searching_dataset(size: int, dataset_type: str) -> Tuple[List[int], int]:
    arr = generate_sorting_dataset(size, dataset_type)
    if size > 0:
        target_idx = random.randint(0, size - 1)
        key = arr[target_idx]
    else:
        key = -1
    return arr, key


def generate_graph_dataset(vertices_count: int) -> Dict[int, List[Tuple[int, int]]]:
    graph = {i: [] for i in range(vertices_count)}
    for i in range(vertices_count - 1):
        weight = random.randint(1, 10)
        graph[i].append((i + 1, weight))
        
    total_edges_target = min(vertices_count * 2, vertices_count * (vertices_count - 1))
    current_edges = vertices_count - 1
    
    while current_edges < total_edges_target:
        u = random.randint(0, vertices_count - 1)
        v = random.randint(0, vertices_count - 1)
        if u != v:
            existing_neighbors = [neighbor for neighbor, _ in graph[u]]
            if v not in existing_neighbors:
                weight = random.randint(1, 10)
                graph[u].append((v, weight))
                current_edges += 1
                
    return graph


def generate_string_dataset(size: int, dataset_type: str) -> Tuple[str, str]:
    pattern_len = min(10, size // 2) if size >= 2 else 1
    
    if dataset_type == "sorted":
        text = "A" * size
        pattern = "A" * pattern_len
    elif dataset_type == "reverse_sorted":
        alphabet = string.ascii_uppercase
        text = "".join(alphabet[i % 26] for i in range(size))
        pattern = text[size // 2 : size // 2 + pattern_len] if size >= 2 else "Z"
    elif dataset_type == "nearly_sorted":
        text = ("A" * max(0, size - pattern_len)) + "B" * pattern_len
        pattern = "A" * max(0, pattern_len - 1) + "B"
    elif dataset_type == "duplicate_heavy":
        text = ("AB" * (size // 2 + 1))[:size]
        pattern = "AB" * (pattern_len // 2 + 1)[:pattern_len]
    elif dataset_type == "edge_cases":
        # All identical except last char
        text = "A" * (size - 1) + "B" if size > 1 else "A"
        pattern = "A" * (pattern_len - 1) + "B" if pattern_len > 1 else "B"
    else:  # random DNA sequence
        chars = ['A', 'C', 'G', 'T']
        text = "".join(random.choice(chars) for _ in range(size))
        if size >= 2:
            start = size // 2
            pattern = text[start : start + pattern_len]
        else:
            pattern = "A"

    return text, pattern


def generate_dag_dataset(vertices_count: int) -> Dict[int, List[Tuple[int, int]]]:
    graph = {i: [] for i in range(vertices_count)}
    for i in range(vertices_count - 1):
        weight = random.randint(1, 10)
        graph[i].append((i + 1, weight))
        
    max_edges = min(vertices_count * 2, (vertices_count * (vertices_count - 1)) // 2)
    current_edges = vertices_count - 1
    
    while current_edges < max_edges:
        u = random.randint(0, vertices_count - 2)
        v = random.randint(u + 1, vertices_count - 1)
        existing = [node for node, _ in graph[u]]
        if v not in existing:
            weight = random.randint(1, 10)
            graph[u].append((v, weight))
            current_edges += 1
            
    return graph


# ============================================================================
# 2. STANDARD ALGORITHM BENCHMARK RUNNER
# ============================================================================

def run_single_benchmark(
    algorithm_name: str,
    dataset_type: str,
    size: int,
    repeats: int = 3,
    prepared_data: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Benchmarks a standard built-in algorithm. Supports repeated runs,
    median execution time calculation, and variance tracking.
    """
    gc.collect()
    
    sorting_algos = ["bubble_sort", "selection_sort", "insertion_sort", "merge_sort", "quick_sort", "heap_sort"]
    searching_algos = ["linear_search", "binary_search"]
    graph_algos = ["bfs", "dfs", "dijkstra", "topological_sort"]
    string_algos = ["naive_pattern_matching", "kmp_search", "horspool_search", "boyer_moore_search"]
    dp_backtrack_algos = ["knapsack", "n_queens"]

    # Limit execution sizes for slow quadratic/exponential algorithms
    is_slow = algorithm_name in ["bubble_sort", "selection_sort", "insertion_sort", "knapsack"]
    if is_slow and size > 10000:
        return {
            "algorithm": algorithm_name,
            "size": size,
            "dataset_type": dataset_type,
            "time_ms": None,
            "time_median_ms": None,
            "time_variance_ms": None,
            "memory_bytes": None,
            "comparisons": None,
            "swaps": None,
            "operations": None,
            "recursion_depth": None,
            "status": "skipped",
            "message": "Skipped to avoid O(N²) execution timeout"
        }

    # Prepare datasets outside measurement interval
    dataset = prepared_data
    if dataset is None:
        if algorithm_name in sorting_algos:
            dataset = generate_sorting_dataset(size, dataset_type)
        elif algorithm_name in searching_algos:
            dataset = generate_searching_dataset(size, dataset_type)
        elif algorithm_name in graph_algos:
            dataset = generate_dag_dataset(size) if algorithm_name == "topological_sort" else generate_graph_dataset(size)
        elif algorithm_name in string_algos:
            dataset = generate_string_dataset(size, dataset_type)
        elif algorithm_name in dp_backtrack_algos:
            if algorithm_name == "knapsack":
                dataset = (
                    [random.randint(10, 100) for _ in range(size)],
                    [random.randint(1, 30) for _ in range(size)],
                    min(1000, size * 5)
                )
            elif algorithm_name == "n_queens":
                if size == 10: queens_n = 8
                elif size == 100: queens_n = 9
                elif size == 1000: queens_n = 10
                elif size == 10000: queens_n = 11
                elif size == 100000: queens_n = 12
                else: queens_n = min(12, size)
                dataset = queens_n

    # Warm-up run (discarded)
    try:
        dummy_tracker = algorithms.Tracker()
        if algorithm_name in sorting_algos:
            getattr(algorithms, algorithm_name)(list(dataset), dummy_tracker)
    except Exception:
        pass

    # Run repeated executions
    measured_times_ms = []
    peak_memory = 0
    tracker = algorithms.Tracker()

    for _ in range(repeats):
        gc.collect()
        t = algorithms.Tracker()
        
        # Build arguments for this invocation
        if algorithm_name in sorting_algos:
            args = [list(dataset), t]
        elif algorithm_name in searching_algos:
            arr, key = dataset
            arr_copy = list(arr)
            if algorithm_name == "binary_search":
                arr_copy.sort()
            args = [arr_copy, key, t]
        elif algorithm_name in graph_algos:
            args = [dataset, t] if algorithm_name == "topological_sort" else [dataset, 0, t]
        elif algorithm_name in string_algos:
            text, pat = dataset
            args = [text, pat, t]
        elif algorithm_name in dp_backtrack_algos:
            if algorithm_name == "knapsack":
                vals, wts, cap = dataset
                args = [vals, wts, cap, t]
            else:
                args = [dataset, t]
        else:
            raise ValueError(f"Unknown algorithm: {algorithm_name}")

        tracemalloc.start()
        start_ns = time.perf_counter_ns()
        try:
            getattr(algorithms, algorithm_name)(*args)
            end_ns = time.perf_counter_ns()
            _, mem = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            
            run_ms = (end_ns - start_ns) / 1_000_000.0
            measured_times_ms.append(run_ms)
            if mem > peak_memory:
                peak_memory = mem
            tracker = t  # keep last run tracker
        except Exception as e:
            tracemalloc.stop()
            return {
                "algorithm": algorithm_name,
                "size": size,
                "dataset_type": dataset_type,
                "time_ms": None,
                "status": "error",
                "message": str(e)
            }

    median_time = statistics.median(measured_times_ms) if measured_times_ms else None
    variance_time = statistics.variance(measured_times_ms) if len(measured_times_ms) > 1 else 0.0

    return {
        "algorithm": algorithm_name,
        "size": size,
        "dataset_type": dataset_type,
        "time_ms": round(median_time, 4) if median_time is not None else None,
        "time_median_ms": round(median_time, 4) if median_time is not None else None,
        "time_variance_ms": round(variance_time, 6),
        "memory_bytes": peak_memory,
        "comparisons": tracker.comparisons,
        "swaps": tracker.swaps,
        "operations": tracker.operations,
        "recursion_depth": tracker.max_recursion_depth,
        "status": "success",
        "message": "Execution complete"
    }


# ============================================================================
# 3. STUDENT ALGORITHM BENCHMARK RUNNER
# ============================================================================

def run_student_benchmark(
    language: str,
    code: str,
    category: str,
    dataset_type: str,
    size: int,
    repeats: int = 3,
    prepared_data: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Benchmarks untrusted student code inside the secure sandbox on an identical dataset.
    Measures median execution time, peak resident memory, and reports compilation vs runtime.
    """
    # Prevent extreme inputs for slow categories
    cat = category.lower()
    if size > 10000 and "sort" in cat and "quick" not in code.lower() and "merge" not in code.lower() and "heap" not in code.lower():
        # Soft skip to prevent massive sandbox stalls if quadratic
        pass

    # 1. Prepare dataset outside timed interval
    dataset = prepared_data
    if dataset is None:
        if "sort" in cat:
            dataset = generate_sorting_dataset(size, dataset_type)
        elif "search" in cat:
            dataset = generate_searching_dataset(size, dataset_type)
        elif "string" in cat:
            dataset = generate_string_dataset(size, dataset_type)
        elif "knapsack" in cat:
            dataset = (
                [random.randint(10, 100) for _ in range(size)],
                [random.randint(1, 30) for _ in range(size)],
                min(1000, size * 5)
            )
        elif "queen" in cat:
            queens_n = 8 if size <= 10 else (9 if size <= 100 else 10)
            dataset = queens_n

    # Format stdin data string
    stdin_data = ""
    if "sort" in cat:
        arr = dataset if isinstance(dataset, list) else []
        stdin_data = f"{len(arr)}\n" + " ".join(map(str, arr)) if arr else "0\n"
    elif "search" in cat:
        arr, key = dataset
        stdin_data = f"{len(arr)} {key}\n" + " ".join(map(str, arr)) if arr else f"0 {key}\n"
    elif "string" in cat:
        text, pat = dataset
        stdin_data = f"{text}\n{pat}\n"
    elif "knapsack" in cat:
        vals, wts, cap = dataset
        stdin_data = f"{len(vals)} {cap}\n" + " ".join(map(str, vals)) + "\n" + " ".join(map(str, wts)) + "\n"
    elif "queen" in cat:
        stdin_data = f"{dataset}\n"

    # Wrap Python if it's a raw function definition
    executable_code = code
    if language.lower() in ["python", "py"]:
        executable_code = CorrectnessValidator.wrap_python_if_needed(code, category)

    measured_times = []
    peak_memory = 0
    compilation_ms = None
    last_exec = None

    for run_idx in range(repeats):
        exec_res = execute_code(
            language=language,
            code=executable_code,
            stdin_data=stdin_data,
            timeout_sec=4.0
        )
        last_exec = exec_res

        if not exec_res.success:
            return {
                "algorithm": "Student Algorithm",
                "size": size,
                "dataset_type": dataset_type,
                "time_ms": None,
                "time_median_ms": None,
                "time_variance_ms": None,
                "memory_bytes": None,
                "operations": None,
                "comparisons": None,
                "swaps": None,
                "recursion_depth": None,
                "compilation_time_ms": exec_res.compilation_time_ms,
                "status": "error" if not exec_res.timed_out else "timeout",
                "message": exec_res.stderr or f"Exit code {exec_res.exit_code}"
            }

        measured_times.append(exec_res.execution_time_ms)
        if exec_res.memory_bytes > peak_memory:
            peak_memory = exec_res.memory_bytes
        if exec_res.compilation_time_ms is not None:
            compilation_ms = exec_res.compilation_time_ms

    median_time = statistics.median(measured_times) if measured_times else 0.0
    variance_time = statistics.variance(measured_times) if len(measured_times) > 1 else 0.0

    return {
        "algorithm": "Student Algorithm",
        "size": size,
        "dataset_type": dataset_type,
        "time_ms": round(median_time, 4),
        "time_median_ms": round(median_time, 4),
        "time_variance_ms": round(variance_time, 6),
        "memory_bytes": peak_memory,
        "operations": None,  # Explicitly None per requirements when not internal instrumented
        "comparisons": None,
        "swaps": None,
        "recursion_depth": None,
        "compilation_time_ms": compilation_ms,
        "status": "success",
        "message": "Execution complete"
    }


# ============================================================================
# 4. FAIR COMPARISON HARNESS
# ============================================================================

def run_fair_comparison(
    student_code: str,
    language: str,
    problem_category: str,
    standard_algorithms: List[str],
    dataset_type: str,
    sizes: List[int]
) -> Dict[str, Any]:
    """
    Generates single canonical dataset instances for each size and benchmarks both
    the student algorithm and selected standard algorithms on the EXACT same input data.
    """
    results = []

    for size in sizes:
        # 1. Generate canonical dataset once per size
        cat = problem_category.lower()
        if "sort" in cat:
            shared_data = generate_sorting_dataset(size, dataset_type)
        elif "search" in cat:
            shared_data = generate_searching_dataset(size, dataset_type)
        elif "string" in cat:
            shared_data = generate_string_dataset(size, dataset_type)
        elif "knapsack" in cat:
            shared_data = (
                [random.randint(10, 100) for _ in range(size)],
                [random.randint(1, 30) for _ in range(size)],
                min(1000, size * 5)
            )
        elif "queen" in cat:
            shared_data = 8 if size <= 10 else (9 if size <= 100 else 10)
        else:
            shared_data = generate_sorting_dataset(size, dataset_type)

        # 2. Benchmark student code on this shared dataset
        student_res = run_student_benchmark(
            language=language,
            code=student_code,
            category=problem_category,
            dataset_type=dataset_type,
            size=size,
            repeats=3,
            prepared_data=shared_data
        )
        results.append(student_res)

        # 3. Benchmark standard algorithms on this exact shared dataset
        for std_algo in standard_algorithms:
            std_res = run_single_benchmark(
                algorithm_name=std_algo,
                dataset_type=dataset_type,
                size=size,
                repeats=3,
                prepared_data=shared_data
            )
            results.append(std_res)

    return {
        "dataset_type": dataset_type,
        "sizes": sizes,
        "results": results
    }
