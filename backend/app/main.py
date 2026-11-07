import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from app import benchmark, ai_prediction, gemini_service
from app.student_service import StudentAnalysisService
from app.database import get_analysis_by_id, list_analyses

app = FastAPI(
    title="Student Algorithm Analyzer and Comparison Platform API",
    description="Backend API to validate, benchmark, predict complexity, analyze quality, and evaluate student code against standard algorithms.",
    version="2.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# LEGACY PYDANTIC SCHEMAS (Preserved for compatibility)
# ============================================================================

class BenchmarkRequest(BaseModel):
    algorithms: List[str]
    dataset_type: str
    sizes: List[int]

class BenchmarkResultItem(BaseModel):
    algorithm: str
    size: int
    dataset_type: str
    time_ms: Optional[float] = None
    time_median_ms: Optional[float] = None
    time_variance_ms: Optional[float] = None
    memory_bytes: Optional[int] = None
    operations: Optional[int] = None
    comparisons: Optional[int] = None
    swaps: Optional[int] = None
    recursion_depth: Optional[int] = None
    compilation_time_ms: Optional[float] = None
    status: str
    message: str

class BenchmarkResponse(BaseModel):
    results: List[BenchmarkResultItem]

class PredictRequestItem(BaseModel):
    size: int
    time_ms: Optional[float] = None
    operations: Optional[int] = None

class PredictRequest(BaseModel):
    algorithm: str
    benchmarks: List[PredictRequestItem]

class RecommendationResponse(BaseModel):
    recommended_algorithm: str
    rationale: List[str]
    alternatives: List[str]

class ExplainRequest(BaseModel):
    algorithm_name: str
    category: str
    size: int
    dataset_type: str
    time_ms: Optional[float] = None
    operations: Optional[int] = None
    memory_bytes: Optional[int] = None
    recursion_depth: Optional[int] = None
    predicted_complexity: str
    custom_api_key: Optional[str] = None

class ExplainResponse(BaseModel):
    explanation: str

class ChatRequestItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatRequestItem]] = []
    custom_code: Optional[str] = None
    compare_algorithms: Optional[List[str]] = []
    custom_api_key: Optional[str] = None

# ============================================================================
# STUDENT ALGORITHM ANALYZER SCHEMAS
# ============================================================================

class StudentValidateRequest(BaseModel):
    language: str
    code: str
    category: str

class StudentBenchmarkRequest(BaseModel):
    language: str
    code: str
    category: str
    dataset_type: str = "random"
    sizes: List[int] = [10, 100, 1000]

class StudentCompareRequest(BaseModel):
    language: str
    code: str
    category: str
    standard_algorithms: List[str]
    dataset_type: str = "random"
    sizes: List[int] = [10, 100, 1000]

class StudentComplexityRequest(BaseModel):
    language: str
    code: str
    category: str
    benchmarks: Optional[List[Dict[str, Any]]] = None

class StudentOptimizeRequest(BaseModel):
    language: str
    code: str
    category: str

class StudentAnalysisRequest(BaseModel):
    algorithm_name: str = "My Custom Algorithm"
    language: str
    category: str
    code: str
    standard_algorithms: Optional[List[str]] = []
    dataset_type: str = "random"
    sizes: Optional[List[int]] = [10, 100, 1000]
    custom_api_key: Optional[str] = None


# ============================================================================
# CORE ENDPOINTS
# ============================================================================

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "FastAPI Student Algorithm Analyzer server is running"}


@app.post("/api/benchmark", response_model=BenchmarkResponse)
def execute_benchmarks(req: BenchmarkRequest):
    results = []
    valid_categories = {
        "sorting": ["bubble_sort", "selection_sort", "insertion_sort", "merge_sort", "quick_sort", "heap_sort"],
        "searching": ["linear_search", "binary_search"],
        "graph": ["bfs", "dfs", "dijkstra", "topological_sort"],
        "string": ["naive_pattern_matching", "kmp_search", "horspool_search", "boyer_moore_search"],
        "advanced": ["knapsack", "n_queens"]
    }
    
    all_valid_algos = []
    for cat_algos in valid_categories.values():
        all_valid_algos.extend(cat_algos)

    for algo in req.algorithms:
        if algo not in all_valid_algos:
            raise HTTPException(status_code=400, detail=f"Invalid algorithm name: {algo}")
            
    for algo in req.algorithms:
        for size in req.sizes:
            res = benchmark.run_single_benchmark(algo, req.dataset_type, size)
            results.append(res)
            
    return {"results": results}


@app.post("/api/predict")
def predict_complexity(req: PredictRequest):
    if len(req.benchmarks) < 3:
        raise HTTPException(status_code=400, detail="Need at least 3 data points to fit curves.")
        
    sizes = [item.size for item in req.benchmarks if item.time_ms is not None]
    runtimes = [item.time_ms for item in req.benchmarks if item.time_ms is not None]
    operations = [item.operations for item in req.benchmarks if item.operations is not None]
    
    time_analysis = ai_prediction.analyze_complexity(sizes, runtimes)
    ops_analysis = ai_prediction.analyze_complexity(sizes, operations) if len(operations) == len(sizes) and len(operations) >= 3 else None
    
    extrapolations = {}
    if time_analysis.get("predicted_class") not in ["Unknown", "Insufficient Data"]:
        fits = time_analysis.get("fits", {})
        best = fits.get(time_analysis["predicted_class"])
        if best:
            for target_size in [100000, 1000000]:
                pred_time = ai_prediction.extrapolate_performance(
                    target_size, 
                    time_analysis["predicted_class"], 
                    best.get("coef", 0.0), 
                    best.get("intercept", 0.0)
                )
                extrapolations[str(target_size)] = round(pred_time, 4)
            
    return {
        "algorithm": req.algorithm,
        "time_complexity_analysis": time_analysis,
        "operations_complexity_analysis": ops_analysis,
        "extrapolations": extrapolations
    }


@app.get("/api/recommend", response_model=RecommendationResponse)
def get_recommendation(
    category: str,
    size: int,
    dataset_type: str,
    memory_constraint: str = "high"
):
    valid_categories = ["sorting", "searching", "graph", "string", "advanced"]
    if category.lower() not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
        
    rec = ai_prediction.recommend_algorithm(category, size, dataset_type, memory_constraint)
    return rec


@app.post("/api/explain", response_model=ExplainResponse)
def get_gemini_explanation(req: ExplainRequest):
    explanation = gemini_service.explain_benchmark_results(
        algorithm_name=req.algorithm_name,
        category=req.category,
        size=req.size,
        dataset_type=req.dataset_type,
        time_ms=req.time_ms,
        operations=req.operations,
        memory_bytes=req.memory_bytes,
        recursion_depth=req.recursion_depth,
        predicted_complexity=req.predicted_complexity,
        custom_api_key=req.custom_api_key
    )
    return {"explanation": explanation}


@app.post("/api/chat")
def chat_with_advisor(req: ChatRequest):
    history_dicts = []
    if req.history:
        for item in req.history:
            history_dicts.append({
                "role": item.role,
                "content": item.content
            })
            
    response_text = gemini_service.chat_with_advisor(
        message=req.message,
        history=history_dicts,
        custom_code=req.custom_code,
        compare_algorithms=req.compare_algorithms,
        custom_api_key=req.custom_api_key
    )
    return {"response": response_text}


# ============================================================================
# STUDENT ALGORITHM ANALYZER ENDPOINTS
# ============================================================================

@app.get("/api/student/algorithms")
def get_supported_algorithms():
    """Returns catalog of supported categories and their standard comparison algorithms."""
    catalog = {
        "sorting": {
            "name": "Sorting",
            "algorithms": [
                {"id": "bubble_sort", "name": "Bubble Sort", "best": "O(n)", "avg": "O(n²)", "worst": "O(n²)", "space": "O(1)"},
                {"id": "selection_sort", "name": "Selection Sort", "best": "O(n²)", "avg": "O(n²)", "worst": "O(n²)", "space": "O(1)"},
                {"id": "insertion_sort", "name": "Insertion Sort", "best": "O(n)", "avg": "O(n²)", "worst": "O(n²)", "space": "O(1)"},
                {"id": "merge_sort", "name": "Merge Sort", "best": "O(n log n)", "avg": "O(n log n)", "worst": "O(n log n)", "space": "O(n)"},
                {"id": "quick_sort", "name": "Quick Sort", "best": "O(n log n)", "avg": "O(n log n)", "worst": "O(n²)", "space": "O(log n)"},
                {"id": "heap_sort", "name": "Heap Sort", "best": "O(n log n)", "avg": "O(n log n)", "worst": "O(n log n)", "space": "O(1)"}
            ]
        },
        "searching": {
            "name": "Searching",
            "algorithms": [
                {"id": "linear_search", "name": "Linear Search", "best": "O(1)", "avg": "O(n)", "worst": "O(n)", "space": "O(1)"},
                {"id": "binary_search", "name": "Binary Search", "best": "O(1)", "avg": "O(log n)", "worst": "O(log n)", "space": "O(1)"}
            ]
        },
        "graph": {
            "name": "Graph Algorithms",
            "algorithms": [
                {"id": "bfs", "name": "Breadth-First Search (BFS)", "best": "O(V+E)", "avg": "O(V+E)", "worst": "O(V+E)", "space": "O(V)"},
                {"id": "dfs", "name": "Depth-First Search (DFS)", "best": "O(V+E)", "avg": "O(V+E)", "worst": "O(V+E)", "space": "O(V)"},
                {"id": "dijkstra", "name": "Dijkstra's Shortest Path", "best": "O(E log V)", "avg": "O(E log V)", "worst": "O(E log V)", "space": "O(V)"},
                {"id": "topological_sort", "name": "Topological Sort (Kahn's)", "best": "O(V+E)", "avg": "O(V+E)", "worst": "O(V+E)", "space": "O(V)"}
            ]
        },
        "string": {
            "name": "String Matching",
            "algorithms": [
                {"id": "naive_pattern_matching", "name": "Naive String Search", "best": "O(n)", "avg": "O(n*m)", "worst": "O(n*m)", "space": "O(1)"},
                {"id": "kmp_search", "name": "Knuth-Morris-Pratt (KMP)", "best": "O(n)", "avg": "O(n+m)", "worst": "O(n+m)", "space": "O(m)"},
                {"id": "horspool_search", "name": "Boyer-Moore-Horspool", "best": "O(n/m)", "avg": "O(n)", "worst": "O(n*m)", "space": "O(m)"},
                {"id": "boyer_moore_search", "name": "Boyer-Moore (Full)", "best": "O(n/m)", "avg": "O(n)", "worst": "O(n*m)", "space": "O(m)"}
            ]
        },
        "advanced": {
            "name": "Dynamic Programming & Backtracking",
            "algorithms": [
                {"id": "knapsack", "name": "0/1 Knapsack (DP)", "best": "O(N*W)", "avg": "O(N*W)", "worst": "O(N*W)", "space": "O(N*W)"},
                {"id": "n_queens", "name": "N-Queens (Backtracking)", "best": "O(1)", "avg": "O(N!)", "worst": "O(N!)", "space": "O(N)"}
            ]
        }
    }
    return catalog


@app.post("/api/student/validate")
def validate_student_algorithm(req: StudentValidateRequest):
    """Executes correctness verification suite across edge, duplicate, and normal test cases."""
    return StudentAnalysisService.validate(
        language=req.language,
        code=req.code,
        category=req.category
    )


@app.post("/api/student/benchmark")
def benchmark_student_algorithm(req: StudentBenchmarkRequest):
    """Benchmarks student code inside sandbox across input sizes."""
    return StudentAnalysisService.benchmark(
        language=req.language,
        code=req.code,
        category=req.category,
        dataset_type=req.dataset_type,
        sizes=req.sizes
    )


@app.post("/api/student/compare")
def compare_student_algorithm(req: StudentCompareRequest):
    """Runs fair synchronized benchmark comparing student algorithm with selected standard algorithms."""
    return StudentAnalysisService.compare_with_standards(
        language=req.language,
        code=req.code,
        category=req.category,
        standard_algorithms=req.standard_algorithms,
        dataset_type=req.dataset_type,
        sizes=req.sizes
    )


@app.post("/api/student/complexity")
def analyze_student_complexity(req: StudentComplexityRequest):
    """Performs both theoretical AST analysis and empirical regression curve fitting."""
    return StudentAnalysisService.analyze_complexity(
        language=req.language,
        code=req.code,
        category=req.category,
        benchmarks=req.benchmarks
    )


@app.post("/api/student/quality")
def analyze_student_quality(req: StudentValidateRequest):
    """Evaluates student source code quality using standard 5-dimension rubric."""
    return StudentAnalysisService.analyze_quality(
        language=req.language,
        code=req.code,
        category=req.category
    )


@app.post("/api/student/optimize")
def optimize_student_code(req: StudentOptimizeRequest):
    """Identifies bottlenecks, explains fixes, and suggests safely optimized code."""
    return StudentAnalysisService.optimize(
        language=req.language,
        code=req.code,
        category=req.category
    )


@app.post("/api/student/analyze")
def run_full_student_analysis(req: StudentAnalysisRequest):
    """Full lifecycle: Validate -> Benchmark -> Complexity -> Quality -> Optimize -> Gemini Report -> Persist."""
    try:
        res = StudentAnalysisService.full_analysis(
            algorithm_name=req.algorithm_name,
            language=req.language,
            category=req.category,
            code=req.code,
            standard_algorithms=req.standard_algorithms,
            dataset_type=req.dataset_type,
            sizes=req.sizes,
            custom_api_key=req.custom_api_key
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/student/history")
def get_student_history(limit: int = 20):
    """Lists past student analysis runs from SQLite persistence."""
    return {"analyses": list_analyses(limit=limit)}


@app.get("/api/student/analysis/{analysis_id}")
def get_student_analysis(analysis_id: str):
    """Fetches complete analysis record by ID."""
    data = get_analysis_by_id(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    return data


@app.get("/api/student/report/{analysis_id}")
def download_student_report(analysis_id: str):
    """Generates a downloadable Markdown analysis report."""
    data = get_analysis_by_id(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    corr = data.get("correctness_results", {})
    comp = data.get("complexity_results", {})
    qual = data.get("quality_results", {})
    ai = data.get("ai_feedback", "")

    report_md = f"""# STUDENT ALGORITHM EVALUATION REPORT
==================================================
**Analysis ID**: {data['id']}
**Algorithm Name**: {data['algorithm_name']}
**Problem Category**: {data['category'].title()}
**Programming Language**: {data['language'].title()}
**Submission Date**: {data['created_at']}

---

## 1. EXECUTIVE SUMMARY
- **Correctness Status**: {'PASSED ALL TESTS' if corr.get('is_correct') else 'DISCREPANCIES DETECTED'}
- **Test Case Pass Rate**: {corr.get('passed_tests', 0)}/{corr.get('total_tests', 0)} ({corr.get('correctness_percentage', 0)}%)
- **Theoretical Worst-Case**: {comp.get('theoretical', {}).get('worst_case', 'N/A')}
- **Empirical Fit**: {comp.get('empirical', {}).get('predicted_class', 'N/A')} (R² = {comp.get('empirical', {}).get('r2_score', 'N/A')})
- **Code Quality Score**: {qual.get('overall_score', 'N/A')}/100 ({qual.get('rating', 'N/A')})

---

## 2. SUBMITTED SOURCE CODE
```{data['language'].lower()}
{data['student_code']}
```

---

## 3. CORRECTNESS VALIDATION
| Test Case | Status | Execution Time |
| :--- | :--- | :--- |
"""
    for tc in corr.get("test_cases", []):
        report_md += f"| {tc['test_id']} | {tc['status']} | {tc['execution_time_ms']} ms |\n"

    report_md += f"""
---

## 4. DETAILED EDUCATIONAL ANALYSIS & RECOMMENDATIONS
{ai}

==================================================
*Generated by Student Algorithm Analyzer and Intelligent Comparison Platform.*
"""
    return PlainTextResponse(content=report_md, media_type="text/markdown")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
