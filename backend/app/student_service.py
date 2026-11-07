"""
Student Algorithm Analysis Service.
Coordinates the end-to-end analysis lifecycle:
1. Correctness Validation
2. Fair Synchronized Benchmarking
3. Theoretical & Empirical Complexity Analysis
4. Code Quality Rubric Evaluation
5. Optimization Engine
6. Gemini AI Educational Report Generation
7. Analysis Persistence in Database
"""

from typing import Dict, Any, List, Optional
from app.correctness import CorrectnessValidator
from app.benchmark import run_student_benchmark, run_fair_comparison
from app.complexity import StaticComplexityAnalyzer, EmpiricalComplexityAnalyzer
from app.quality.analyzer import CodeQualityAnalyzer
from app.optimization.optimizer import CodeOptimizer
from app.gemini_service import generate_student_algorithm_report
from app.database import save_analysis, get_analysis_by_id, list_analyses

class StudentAnalysisService:
    @classmethod
    def validate(cls, language: str, code: str, category: str) -> Dict[str, Any]:
        return CorrectnessValidator.validate(language=language, code=code, category=category)

    @classmethod
    def benchmark(
        cls,
        language: str,
        code: str,
        category: str,
        dataset_type: str = "random",
        sizes: Optional[List[int]] = None
    ) -> List[Dict[str, Any]]:
        test_sizes = sizes or [10, 100, 1000]
        results = []
        for s in test_sizes:
            res = run_student_benchmark(
                language=language,
                code=code,
                category=category,
                dataset_type=dataset_type,
                size=s,
                repeats=3
            )
            results.append(res)
        return results

    @classmethod
    def compare_with_standards(
        cls,
        language: str,
        code: str,
        category: str,
        standard_algorithms: List[str],
        dataset_type: str = "random",
        sizes: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        test_sizes = sizes or [10, 100, 1000]
        return run_fair_comparison(
            student_code=code,
            language=language,
            problem_category=category,
            standard_algorithms=standard_algorithms,
            dataset_type=dataset_type,
            sizes=test_sizes
        )

    @classmethod
    def analyze_complexity(
        cls,
        language: str,
        code: str,
        category: str,
        benchmarks: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        theoretical = StaticComplexityAnalyzer.analyze(language=language, code=code, category=category)

        sizes = []
        runtimes = []
        if benchmarks:
            for b in benchmarks:
                if b.get("time_ms") is not None and b.get("size") is not None:
                    sizes.append(b["size"])
                    runtimes.append(b["time_ms"])

        empirical = EmpiricalComplexityAnalyzer.fit_complexity(sizes, runtimes)

        return {
            "theoretical": theoretical,
            "empirical": empirical
        }

    @classmethod
    def analyze_quality(cls, language: str, code: str, category: str) -> Dict[str, Any]:
        return CodeQualityAnalyzer.analyze(code=code, language=language, category=category)

    @classmethod
    def optimize(cls, language: str, code: str, category: str) -> Dict[str, Any]:
        return CodeOptimizer.generate_optimizations(language=language, code=code, category=category)

    @classmethod
    def full_analysis(
        cls,
        algorithm_name: str,
        language: str,
        category: str,
        code: str,
        standard_algorithms: Optional[List[str]] = None,
        dataset_type: str = "random",
        sizes: Optional[List[int]] = None,
        custom_api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        test_sizes = sizes or [10, 100, 1000]
        std_algos = standard_algorithms or []

        # 1. Correctness Validation
        correctness_res = cls.validate(language=language, code=code, category=category)

        # 2. Benchmarking (Run even if partially failing for diagnostic analysis, but mark clearly)
        comparison_res = cls.compare_with_standards(
            language=language,
            code=code,
            category=category,
            standard_algorithms=std_algos,
            dataset_type=dataset_type,
            sizes=test_sizes
        )

        student_benchmarks = [
            r for r in comparison_res.get("results", [])
            if r.get("algorithm") == "Student Algorithm"
        ]

        # 3. Complexity Analysis
        complexity_res = cls.analyze_complexity(
            language=language,
            code=code,
            category=category,
            benchmarks=student_benchmarks
        )

        # 4. Code Quality Analysis
        quality_res = cls.analyze_quality(language=language, code=code, category=category)

        # 5. Optimization Suggestions
        optimization_res = cls.optimize(language=language, code=code, category=category)

        # 6. Gemini AI Educational Report (Sections A through K)
        ai_report = generate_student_algorithm_report(
            student_code=code,
            language=language,
            problem_category=category,
            correctness_report=correctness_res,
            benchmark_report=comparison_res,
            complexity_report=complexity_res,
            quality_report=quality_res,
            comparison_results=comparison_res.get("results", []),
            custom_api_key=custom_api_key
        )

        # 7. Persistence
        analysis_id = save_analysis(
            algorithm_name=algorithm_name,
            category=category,
            language=language,
            student_code=code,
            correctness_results=correctness_res,
            benchmark_results=comparison_res,
            complexity_results=complexity_res,
            quality_results=quality_res,
            optimization_results=optimization_res,
            ai_feedback=ai_report
        )

        return {
            "analysis_id": analysis_id,
            "algorithm_name": algorithm_name,
            "language": language,
            "category": category,
            "correctness": correctness_res,
            "benchmarks": comparison_res,
            "complexity": complexity_res,
            "quality": quality_res,
            "optimizations": optimization_res,
            "ai_report": ai_report
        }

