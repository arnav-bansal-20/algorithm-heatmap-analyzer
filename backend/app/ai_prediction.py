import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from typing import Dict, Any, List

# 1. Complexity Classification & Extrapolation

def analyze_complexity(sizes: List[int], values: List[float]) -> Dict[str, Any]:
    """
    Fits sizes and values (runtimes or operations) to regression models for:
    - O(log N)
    - O(N)
    - O(N log N)
    - O(N^2)
    Returns the best fitting class, R^2 scores, and regression coefficients.
    """
    if len(sizes) < 3 or any(v is None for v in values):
        return {
            "predicted_class": "Insufficient Data",
            "confidence": 0.0,
            "fits": {}
        }
        
    X_val = np.array(sizes, dtype=float)
    y_val = np.array(values, dtype=float)
    
    # Avoid log(0)
    X_val = np.where(X_val <= 0, 1, X_val)
    
    # Define features
    features = {
        "O(log n)": np.log2(X_val).reshape(-1, 1),
        "O(n)": X_val.reshape(-1, 1),
        "O(n log n)": (X_val * np.log2(X_val)).reshape(-1, 1),
        "O(n²)": (X_val ** 2).reshape(-1, 1)
    }
    
    fits = {}
    best_class = None
    best_r2 = -float('inf')
    best_coef = 0.0
    best_intercept = 0.0
    
    for class_name, X in features.items():
        try:
            model = LinearRegression(fit_intercept=True)
            model.fit(X, y_val)
            r2 = model.score(X, y_val)
            
            # Penalize negative coefficients if N increases but time decreases (anomalous)
            # though for operations/time it should generally be positive
            coef = model.coef_[0]
            intercept = model.intercept_
            
            fits[class_name] = {
                "r2": max(0.0, round(r2, 4)),
                "coef": float(coef),
                "intercept": float(intercept)
            }
            
            if r2 > best_r2:
                best_r2 = r2
                best_class = class_name
                best_coef = float(coef)
                best_intercept = float(intercept)
        except Exception:
            fits[class_name] = {"r2": 0.0, "coef": 0.0, "intercept": 0.0}
            
    # Determine confidence
    confidence = max(0.0, min(1.0, best_r2))
    
    return {
        "predicted_class": best_class if best_class else "Unknown",
        "confidence": round(confidence, 4),
        "coef": best_coef,
        "intercept": best_intercept,
        "fits": fits
    }


def extrapolate_performance(size: int, complexity_class: str, coef: float, intercept: float) -> float:
    """
    Extrapolates value (time/ops) for a given size using the fitted regression parameters.
    """
    if size <= 0:
        return 0.0
        
    if complexity_class == "O(log n)":
        x = np.log2(size)
    elif complexity_class == "O(n)":
        x = size
    elif complexity_class == "O(n log n)":
        x = size * np.log2(size)
    elif complexity_class == "O(n²)":
        x = size ** 2
    else:
        return 0.0
        
    pred = coef * x + intercept
    return max(0.0, float(pred))


# 2. Recommendation Engine

def recommend_algorithm(category: str, size: int, dataset_type: str, memory_constraint: str) -> Dict[str, Any]:
    """
    Recommends the best algorithm based on parameters:
    - category: 'sorting', 'searching', 'graph', 'string', 'advanced'
    - size: input size (10 to 100000)
    - dataset_type: 'random', 'sorted', 'reverse_sorted', 'nearly_sorted'
    - memory_constraint: 'low' (low memory footprint), 'medium', 'high'
    """
    category = category.lower()
    dataset_type = dataset_type.lower()
    memory_constraint = memory_constraint.lower()
    
    recommendation = ""
    rationale = []
    alternatives = []
    
    if category == "sorting":
        if size <= 50:
            recommendation = "Insertion Sort"
            rationale.append("For tiny arrays (N <= 50), Insertion Sort has negligible constant overhead and outperforms O(N log N) algorithms.")
            rationale.append("It sorts in-place (O(1) auxiliary space) and is stable.")
            alternatives = ["Quick Sort", "Merge Sort"]
        elif dataset_type == "nearly_sorted":
            recommendation = "Insertion Sort"
            rationale.append("The dataset is nearly sorted. Insertion Sort runs in near O(N) time in this scenario, outperforming Merge/Heap Sort.")
            rationale.append("It requires O(1) auxiliary space and is stable.")
            alternatives = ["Quick Sort", "Merge Sort"]
        elif memory_constraint == "low":
            recommendation = "Heap Sort"
            rationale.append("Under strict memory constraints, Heap Sort is the best choice because it provides guaranteed O(N log N) time with O(1) auxiliary space.")
            rationale.append("Unlike Quick Sort, it has a guaranteed O(N log N) worst-case. Unlike Merge Sort, it requires no extra memory.")
            alternatives = ["Quick Sort"]
        else:
            if dataset_type == "reverse_sorted":
                recommendation = "Merge Sort"
                rationale.append("For reverse-sorted datasets, Merge Sort is recommended due to its guaranteed stable O(N log N) performance.")
                rationale.append("It does not suffer from pivot degradation.")
                alternatives = ["Heap Sort", "Quick Sort"]
            else:
                recommendation = "Quick Sort"
                rationale.append("For general-purpose large sorting, Quick Sort is typically the fastest in practice due to excellent cache locality.")
                rationale.append("Average time complexity is O(N log N) with low constant factors.")
                alternatives = ["Merge Sort", "Heap Sort"]

    elif category == "searching":
        if dataset_type == "sorted":
            recommendation = "Binary Search"
            rationale.append("Since the dataset is sorted, Binary Search runs in O(log N) time, which is exponentially faster than Linear Search's O(N).")
            alternatives = ["Linear Search"]
        else:
            recommendation = "Linear Search"
            rationale.append("For unsorted datasets, Linear Search is the only option unless you sort the data first.")
            rationale.append("If searching many times, sort the dataset once and use Binary Search.")
            alternatives = ["Binary Search (requires sorting first)"]

    elif category == "graph":
        if dataset_type == "sorted":
            recommendation = "Topological Sort"
            rationale.append("For scheduling dependencies and sorting directed acyclic graphs (DAGs), Topological Sort runs in O(V + E) time.")
            rationale.append("It computes a linear ordering of nodes matching topological rules.")
            alternatives = ["DFS (using vertex finish times)", "BFS"]
        elif memory_constraint == "low":
            recommendation = "DFS"
            rationale.append("DFS (Depth-First Search) requires space proportional to recursion depth O(V).")
            rationale.append("In sparse graphs or trees, DFS can consume less memory than BFS queue storage.")
            alternatives = ["BFS", "Dijkstra", "Topological Sort"]
        else:
            recommendation = "BFS"
            rationale.append("For unweighted graphs, BFS finds the shortest path in O(V + E) time.")
            rationale.append("If edges have weights, Dijkstra's algorithm must be used.")
            alternatives = ["Dijkstra (for weighted graphs)", "DFS", "Topological Sort"]

    elif category == "string":
        if dataset_type == "sorted" or dataset_type == "nearly_sorted":
            recommendation = "KMP"
            rationale.append("For highly repetitive alphabets (like DNA or uniform sequences), KMP (Knuth-Morris-Pratt) excels by using its prefix table to avoid redundant comparisons.")
            alternatives = ["Boyer-Moore", "Naive Matching"]
        else:
            recommendation = "Boyer-Moore"
            rationale.append("For large alphabets (e.g. English text) and random patterns, Boyer-Moore is the fastest in practice.")
            rationale.append("It can skip large sections of text, leading to sub-linear O(N/M) average performance.")
            alternatives = ["KMP", "Naive Matching"]
            
    elif category == "advanced":
        if memory_constraint == "low":
            recommendation = "Knapsack"
            rationale.append("The 0/1 Knapsack problem can be solved dynamically in O(W) auxiliary space using a 1D state array, which fits low memory requirements.")
            rationale.append("In contrast, N-Queens backtracking requires O(N) board stack depth but grows exponentially in search iterations.")
            alternatives = ["N-Queens"]
        else:
            if size <= 100:
                recommendation = "N-Queens"
                rationale.append("For backtracking satisfiability searches on small boards (N <= 12), N-Queens backtracking checks safe row/column layout configurations.")
                alternatives = ["Knapsack"]
            else:
                recommendation = "Knapsack"
                rationale.append("For larger inputs, Knapsack (Dynamic Programming) runs in O(N·W) time, which is pseudo-polynomial.")
                rationale.append("N-Queens backtracking cannot handle input sizes greater than 15 due to O(N!) factorial growth.")
                alternatives = ["N-Queens"]
            
    else:
        recommendation = "N/A"
        rationale.append("Unknown category")

    return {
        "recommended_algorithm": recommendation,
        "rationale": rationale,
        "alternatives": alternatives
    }
