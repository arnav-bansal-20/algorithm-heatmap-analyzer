import time
import tracemalloc
import random
import string
import gc
from typing import Dict, Any, List, Tuple
from app import algorithms

# Dataset Generation Functions

def generate_sorting_dataset(size: int, dataset_type: str) -> List[int]:
    if dataset_type == "sorted":
        return list(range(size))
    elif dataset_type == "reverse_sorted":
        return list(range(size - 1, -1, -1))
    elif dataset_type == "nearly_sorted":
        arr = list(range(size))
        # Swap about 10% of adjacent pairs
        swaps = max(1, size // 10)
        for _ in range(swaps):
            idx = random.randint(0, size - 2)
            arr[idx], arr[idx + 1] = arr[idx + 1], arr[idx]
        return arr
    else:  # random
        # Seed for reproducibility per run if desired, or keep it dynamic
        return [random.randint(1, size * 10) for _ in range(size)]


def generate_searching_dataset(size: int, dataset_type: str) -> Tuple[List[int], int]:
    arr = generate_sorting_dataset(size, dataset_type)
    # Search key will be in the middle/end or random.
    # We will search for a value that is likely present.
    if size > 0:
        target_idx = random.randint(0, size - 1)
        # For sorted or nearly sorted, values are sequential. For random, they are arbitrary.
        key = arr[target_idx]
    else:
        key = -1
    return arr, key


def generate_graph_dataset(vertices_count: int) -> Dict[int, List[Tuple[int, int]]]:
    # Vertices: 0 to vertices_count - 1
    graph = {i: [] for i in range(vertices_count)}
    
    # Ensure connectivity: create a cycle or simple spine path
    for i in range(vertices_count - 1):
        # Edge from i to i+1 with weight
        weight = random.randint(1, 10)
        graph[i].append((i + 1, weight))
        
    # Add random edges up to 2 * vertices_count
    total_edges_target = min(vertices_count * 2, vertices_count * (vertices_count - 1))
    current_edges = vertices_count - 1
    
    while current_edges < total_edges_target:
        u = random.randint(0, vertices_count - 1)
        v = random.randint(0, vertices_count - 1)
        if u != v:
            # Check if edge already exists
            existing_neighbors = [neighbor for neighbor, _ in graph[u]]
            if v not in existing_neighbors:
                weight = random.randint(1, 10)
                graph[u].append((v, weight))
                current_edges += 1
                
    return graph


def generate_string_dataset(size: int, dataset_type: str) -> Tuple[str, str]:
    # text of length 'size', pattern of length 10 or min(size//2, 10)
    pattern_len = min(10, size // 2) if size >= 2 else 1
    
    if dataset_type == "sorted":
        text = "A" * size
        pattern = "A" * pattern_len
    elif dataset_type == "reverse_sorted":
        # A repeating sequence of Z to A
        alphabet = string.ascii_uppercase
        text = "".join(alphabet[i % 26] for i in range(size))
        pattern = text[size // 2 : size // 2 + pattern_len] if size >= 2 else "Z"
    elif dataset_type == "nearly_sorted":
        # A sequence with small differences
        text = ("A" * (size - pattern_len)) + "B" * pattern_len
        pattern = "A" * (pattern_len - 1) + "B"
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
    # Vertices: 0 to vertices_count - 1
    graph = {i: [] for i in range(vertices_count)}
    
    # Ensure connectivity: directed acyclic paths only (forward edges: u -> v where u < v)
    for i in range(vertices_count - 1):
        weight = random.randint(1, 10)
        graph[i].append((i + 1, weight))
        
    # Add random acyclic edges
    max_edges = min(vertices_count * 2, (vertices_count * (vertices_count - 1)) // 2)
    current_edges = vertices_count - 1
    
    while current_edges < max_edges:
        u = random.randint(0, vertices_count - 2)
        v = random.randint(u + 1, vertices_count - 1)
        # Check if edge already exists
        existing = [node for node, _ in graph[u]]
        if v not in existing:
            weight = random.randint(1, 10)
            graph[u].append((v, weight))
            current_edges += 1
            
    return graph


# Benchmark Runner

def run_single_benchmark(algorithm_name: str, dataset_type: str, size: int) -> Dict[str, Any]:
    # Setup garbage collection to avoid memory interference
    gc.collect()
    
    tracker = algorithms.Tracker()
    
    # 1. Generate appropriate dataset
    # We must mapping category based on algorithm name
    sorting_algos = ["bubble_sort", "selection_sort", "insertion_sort", "merge_sort", "quick_sort", "heap_sort"]
    searching_algos = ["linear_search", "binary_search"]
    graph_algos = ["bfs", "dfs", "dijkstra", "topological_sort"]
    string_algos = ["naive_pattern_matching", "kmp_search", "horspool_search", "boyer_moore_search"]
    dp_backtrack_algos = ["knapsack", "n_queens"]

    # Limit execution sizes for slow/quadratic/exponential algorithms to avoid hangs
    is_slow = algorithm_name in ["bubble_sort", "selection_sort", "insertion_sort", "knapsack"]
    if is_slow and size > 10000:
        return {
            "algorithm": algorithm_name,
            "size": size,
            "dataset_type": dataset_type,
            "time_ms": None,
            "memory_bytes": None,
            "operations": None,
            "recursion_depth": None,
            "status": "skipped",
            "message": "Skipped to avoid O(N²) execution timeout"
        }

    # Generate data and setup function call
    func_args = []
    
    if algorithm_name in sorting_algos:
        arr = generate_sorting_dataset(size, dataset_type)
        func = getattr(algorithms, algorithm_name)
        func_args = [arr, tracker]
        
    elif algorithm_name in searching_algos:
        arr, key = generate_searching_dataset(size, dataset_type)
        if algorithm_name == "binary_search":
            arr.sort()  # Binary Search requires sorted array!
        func = getattr(algorithms, algorithm_name)
        func_args = [arr, key, tracker]
        
    elif algorithm_name in graph_algos:
        if algorithm_name == "topological_sort":
            graph = generate_dag_dataset(size)
        else:
            graph = generate_graph_dataset(size)  # N is vertices count
        func = getattr(algorithms, algorithm_name)
        func_args = [graph, tracker] if algorithm_name == "topological_sort" else [graph, 0, tracker]
        
    elif algorithm_name in string_algos:
        text, pattern = generate_string_dataset(size, dataset_type)
        func = getattr(algorithms, algorithm_name)
        func_args = [text, pattern, tracker]
        
    elif algorithm_name in dp_backtrack_algos:
        if algorithm_name == "knapsack":
            values = [random.randint(10, 100) for _ in range(size)]
            weights = [random.randint(1, 30) for _ in range(size)]
            capacity = min(1000, size * 5)
            func = algorithms.knapsack
            func_args = [values, weights, capacity, tracker]
        elif algorithm_name == "n_queens":
            # Map input sizes 10, 100, 1000, 10000, 100000 to safe queens boards (8 to 12)
            if size == 10: queens_n = 8
            elif size == 100: queens_n = 9
            elif size == 1000: queens_n = 10
            elif size == 10000: queens_n = 11
            elif size == 100000: queens_n = 12
            else: queens_n = min(12, size)
            func = algorithms.n_queens
            func_args = [queens_n, tracker]
    else:
        raise ValueError(f"Unknown algorithm: {algorithm_name}")

    # 2. Run with telemetry
    tracemalloc.start()
    start_time = time.perf_counter_ns()
    
    try:
        # Execute the function
        func(*func_args)
        
        end_time = time.perf_counter_ns()
        _, peak_memory = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        
        execution_time_ms = (end_time - start_time) / 1_000_000.0  # Convert ns to ms
        
        # Soft check for timeout (e.g. if single run takes > 2.0 seconds)
        status = "success"
        if execution_time_ms > 2000.0:
            status = "slow"
            
        return {
            "algorithm": algorithm_name,
            "size": size,
            "dataset_type": dataset_type,
            "time_ms": round(execution_time_ms, 4),
            "memory_bytes": peak_memory,
            "operations": tracker.operations,
            "recursion_depth": tracker.max_recursion_depth,
            "status": status,
            "message": "Execution complete"
        }
    except Exception as e:
        tracemalloc.stop()
        return {
            "algorithm": algorithm_name,
            "size": size,
            "dataset_type": dataset_type,
            "time_ms": None,
            "memory_bytes": None,
            "operations": None,
            "recursion_depth": None,
            "status": "error",
            "message": str(e)
        }
