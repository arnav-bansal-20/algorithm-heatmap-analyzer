import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app import benchmark, ai_prediction, gemini_service

app = FastAPI(
    title="Algorithm Complexity Heatmap Analyzer API",
    description="Backend API to benchmark algorithms, predict complexity using regression modeling, and generate performance analysis summaries.",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas

class BenchmarkRequest(BaseModel):
    algorithms: List[str]
    dataset_type: str
    sizes: List[int]

class BenchmarkResultItem(BaseModel):
    algorithm: str
    size: int
    dataset_type: str
    time_ms: Optional[float] = None
    memory_bytes: Optional[int] = None
    operations: Optional[int] = None
    recursion_depth: Optional[int] = None
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


# Endpoints

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "FastAPI server is running"}


@app.post("/api/benchmark", response_model=BenchmarkResponse)
def execute_benchmarks(req: BenchmarkRequest):
    results = []
    
    # Validation
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
    
    # Fit regression on execution time
    time_analysis = ai_prediction.analyze_complexity(sizes, runtimes)
    
    # Fit regression on operation counts (often much cleaner/deterministic)
    ops_analysis = ai_prediction.analyze_complexity(sizes, operations) if len(operations) == len(sizes) else None
    
    # Extrapolate for sizes 10^5 and 10^6
    extrapolations = {}
    if time_analysis["predicted_class"] != "Unknown" and time_analysis["predicted_class"] != "Insufficient Data":
        for target_size in [100000, 1000000]:
            pred_time = ai_prediction.extrapolate_performance(
                target_size, 
                time_analysis["predicted_class"], 
                time_analysis["coef"], 
                time_analysis["intercept"]
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
