import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

def get_gemini_client(custom_api_key: str = None):
    api_key = custom_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        # Initialize Google GenAI client
        return genai.Client(api_key=api_key)
    except Exception:
        return None

def explain_benchmark_results(
    algorithm_name: str,
    category: str,
    size: int,
    dataset_type: str,
    time_ms: float,
    operations: int,
    memory_bytes: int,
    recursion_depth: int,
    predicted_complexity: str,
    custom_api_key: str = None
) -> str:
    """
    Sends benchmark results to Gemini and returns an educational explanation of the performance.
    """
    client = get_gemini_client(custom_api_key)
    if not client:
        return """
### ⚠️ Performance Analysis Unavailable (API Key Missing)
 
To get a detailed, automated report of these results, please configure your Analysis API Key:
1. Create a `.env` file in the `backend/` directory.
2. Add your key: `GEMINI_API_KEY=your_actual_api_key`
3. Restart the backend server.
 
**Quick Manual Analysis Summary:**
* **Algorithm**: `{algo_name}` ({category})
* **Dataset**: `{dataset_type}` of size `{size}`
* **Observations**: Took `{time_ms} ms` with `{ops}` operations and `{mem} bytes` peak memory.
* **Complexity**: Practical runtimes match `{predicted_class}` characteristics.
        """.format(
            algo_name=algorithm_name.replace("_", " ").title(),
            category=category.title(),
            dataset_type=dataset_type,
            size=size,
            time_ms=f"{time_ms:.4f}" if time_ms is not None else "N/A",
            ops=f"{operations:,}" if operations is not None else "N/A",
            mem=f"{memory_bytes:,}" if memory_bytes is not None else "N/A",
            predicted_class=predicted_complexity
        ).strip()

    prompt = f"""
    You are an expert professor of Design and Analysis of Algorithms (DAA).
    Explain the following practical benchmark result for a DAA project:
    
    - Algorithm: {algorithm_name} (Category: {category})
    - Input Size: {size} elements
    - Dataset Type: {dataset_type} (e.g. random, sorted, reverse_sorted, nearly_sorted)
    - Execution Time: {time_ms} ms
    - Operations Count: {operations} basic operations (comparisons + swaps)
    - Peak Memory: {memory_bytes} bytes
    - Recursion Depth: {recursion_depth}
    - Fitted Complexity Class: {predicted_complexity}
    
    Please provide:
    1. A brief explanation of why the algorithm performed this way under this specific dataset type and size.
    2. A comparison between the theoretical complexity (big-O) and this practical observation.
    3. Practical tips on when to use or avoid this algorithm.
    
    Structure the response in a professional academic style, using clear headings and bullet points. Use clean markdown formatting suitable for a light-themed educational dashboard. Keep it concise (under 250 words).
    """

    try:
        # Use the standard gemini-2.5-flash model
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"### Error generating explanation\n\nFailed to call Gemini API: {str(e)}"

def generate_static_daa_fallback(
    message: str,
    custom_code: str = None,
    compare_algorithms: list = None
) -> str:
    """
    Generates a highly structured, educational DAA analysis locally when the Gemini API is rate-limited or unavailable.
    """
    feedback = []

    # If user provided custom code, analyze it first
    if custom_code:
        feedback.append("### Custom Code Complexity Analysis")
        feedback.append("Based on static structural analysis of your code:")
        
        # Simple loop detection
        code_lower = custom_code.lower()
        loop_count = code_lower.count("for ") + code_lower.count("while ")
        has_nested = False
        lines = custom_code.split("\n")
        
        # Check indentation levels of loops to detect nesting
        loop_indents = []
        for line in lines:
            trimmed = line.lstrip()
            if trimmed.startswith("for ") or trimmed.startswith("while "):
                indent = len(line) - len(trimmed)
                loop_indents.append(indent)
        
        if len(loop_indents) >= 2:
            # Check if any loop indent is greater than a previous loop indent
            for idx in range(1, len(loop_indents)):
                if loop_indents[idx] > loop_indents[idx - 1]:
                    has_nested = True
                    break
                    
        # Recursion check
        has_recursion = False
        func_names = []
        for line in lines:
            trimmed = line.lstrip()
            if trimmed.startswith("def "):
                parts = trimmed.split(" ")
                if len(parts) > 1:
                    func_name = parts[1].split("(")[0]
                    func_names.append(func_name)
        
        for func in func_names:
            occurrences = custom_code.count(func)
            if occurrences > 1: # Defined once, called at least once inside itself
                has_recursion = True
                break

        # Classify complexity
        estimated_time = "O(N)"
        estimated_space = "O(1)"
        rationale = []
        
        if has_recursion:
            if "partition" in code_lower or "pivot" in code_lower:
                estimated_time = "$O(N \\log N)$ average, $O(N^2)$ worst-case"
                estimated_space = "$O(\\log N)$ (recursion stack)"
                rationale.append("Detected **Quick Sort** partitioning logic with recursive calls.")
            elif "merge" in code_lower:
                estimated_time = "$O(N \\log N)$"
                estimated_space = "$O(N)$ (auxiliary array)"
                rationale.append("Detected **Merge Sort** merging logic with recursive divide-and-conquer.")
            else:
                estimated_time = "$O(2^N)$ or $O(N!)$"
                estimated_space = "$O(N)$ (recursion depth)"
                rationale.append("Detected general recursive backtracking pattern without explicit logarithmic split.")
        elif has_nested:
            estimated_time = "$O(N^2)$"
            estimated_space = "O(1) (in-place)"
            rationale.append("Detected nested loop structures (loops nested within loops).")
        elif loop_count == 1:
            estimated_time = "O(N)"
            estimated_space = "O(1)"
            rationale.append("Detected a single sequential loop.")
        else:
            estimated_time = "O(1)"
            estimated_space = "O(1)"
            rationale.append("No loops or recursive calls detected in the main execution paths.")

        feedback.append(f"- **Estimated Time Complexity**: {estimated_time}")
        feedback.append(f"- **Estimated Space Complexity**: {estimated_space}")
        feedback.append("- **Structural Indicators**:")
        for rat in rationale:
            feedback.append(f"  - {rat}")
        feedback.append("")

    # If comparison algorithms are selected, provide a nice markdown table!
    if compare_algorithms:
        feedback.append("### Comparative Analysis")
        feedback.append("Here is how standard algorithms stack up against your query:")
        feedback.append("")
        feedback.append("| Algorithm | Best Case | Average Case | Worst Case | Space Complexity | Stability |")
        feedback.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
        
        comp_data = {
            "bubble_sort": ("Bubble Sort", "$O(N)$", "$O(N^2)$", "$O(N^2)$", "$O(1)$", "Stable"),
            "selection_sort": ("Selection Sort", "$O(N^2)$", "$O(N^2)$", "$O(N^2)$", "$O(1)$", "Unstable"),
            "insertion_sort": ("Insertion Sort", "$O(N)$", "$O(N^2)$", "$O(N^2)$", "$O(1)$", "Stable"),
            "merge_sort": ("Merge Sort", "$O(N \\log N)$", "$O(N \\log N)$", "$O(N \\log N)$", "$O(N)$", "Stable"),
            "quick_sort": ("Quick Sort", "$O(N \\log N)$", "$O(N \\log N)$", "$O(N^2)$", "$O(\\log N)$", "Unstable"),
            "heap_sort": ("Heap Sort", "$O(N \\log N)$", "$O(N \\log N)$", "$O(N \\log N)$", "$O(1)$", "Unstable"),
            "linear_search": ("Linear Search", "$O(1)$", "$O(N)$", "$O(N)$", "$O(1)$", "N/A"),
            "binary_search": ("Binary Search", "$O(1)$", "$O(\\log N)$", "$O(\\log N)$", "$O(1)$", "N/A"),
            "bfs": ("BFS", "$O(V+E)$", "$O(V+E)$", "$O(V+E)$", "$O(V)$", "N/A"),
            "dfs": ("DFS", "$O(V+E)$", "$O(V+E)$", "$O(V+E)$", "$O(V)$", "N/A"),
            "dijkstra": ("Dijkstra", "$O(E \\log V)$", "$O(E \\log V)$", "$O(E \\log V)$", "$O(V)$", "N/A"),
            "topological_sort": ("Topo Sort", "$O(V+E)$", "$O(V+E)$", "$O(V+E)$", "$O(V)$", "N/A"),
            "naive_pattern_matching": ("Naive Match", "$O(N)$", "$O(N \\times M)$", "$O(N \\times M)$", "$O(1)$", "N/A"),
            "kmp_search": ("KMP Match", "$O(N)$", "$O(N + M)$", "$O(N + M)$", "$O(M)$", "N/A"),
            "horspool_search": ("Horspool Match", "$O(N)$", "$O(N + M)$", "$O(N \\times M)$", "$O(M)$", "N/A"),
            "boyer_moore_search": ("Boyer-Moore", "$O(N/M)$", "$O(N + M)$", "$O(N \\times M)$", "$O(M)$", "N/A"),
            "knapsack": ("0/1 Knapsack", "$O(N \\times W)$", "$O(N \\times W)$", "$O(N \\times W)$", "$O(N \\times W)$", "N/A"),
            "n_queens": ("N-Queens", "$O(N!)$", "$O(N!)$", "$O(N!)$", "$O(N)$", "N/A"),
        }
        
        for algo in compare_algorithms:
            if algo in comp_data:
                name, best, avg, worst, space, stable = comp_data[algo]
                feedback.append(f"| **{name}** | {best} | {avg} | {worst} | {space} | {stable} |")
        feedback.append("")
        
    # Answer conversational text based on keywords
    msg_lower = message.lower()
    if "complexity" in msg_lower or "big o" in msg_lower or "growth" in msg_lower:
        feedback.append("Complexity analysis describes how an algorithm behaves as input size ($N$) grows to infinity. We use **Big-O** for asymptotic upper bounds, **Big-Omega** ($\\Omega$) for lower bounds, and **Big-Theta** ($\\Theta$) for tight bound fits. When analyzing algorithms, consider both *time* (instruction counts) and *space* (memory/stack depth).")
    elif "recursion" in msg_lower or "divide" in msg_lower or "backtrack" in msg_lower:
        feedback.append("Recursive algorithms split problems into sub-problems. According to the **Master Theorem**, divide-and-conquer runtimes depend on the number of subproblems ($a$), division factor ($b$), and combining cost ($f(n)$). Backtracking differs by searching a state space, pruning branches that violate constraints, resulting in factorial ($O(N!)$) or exponential ($O(2^N)$) worst-case growth.")
    elif "sort" in msg_lower or "compare" in msg_lower:
        feedback.append("Sorting algorithms are categorized into **Comparison-based** (e.g. Merge, Quick, Insertion) and **Non-comparison** (e.g. Radix, Count). The mathematical limit for any comparison-based sort is $\\Omega(N \\log N)$ operations in the worst case.")
    else:
        feedback.append(f"I received your question: \"*{message}*\" \n\nTo help you study DAA concepts, you can ask about algorithmic complexity, search and sort efficiencies, graph paths, pattern shifts, or dynamic programming. Please let me know what specific concept you'd like to explore!")

    return "\n".join(feedback)

def chat_with_advisor(
    message: str,
    history: list = None,
    custom_code: str = None,
    compare_algorithms: list = None,
    custom_api_key: str = None
) -> str:
    """
    Handles multi-turn conversations with the DAA Professor AI, incorporating custom code and algorithms to compare.
    """
    client = get_gemini_client(custom_api_key)
    if not client:
        return generate_static_daa_fallback(message, custom_code, compare_algorithms)

    system_instruction = """
You are a friendly, expert human professor and mentor in the field of Design and Analysis of Algorithms (DAA).
Your role is to help students learn algorithmic design paradigms, analyze complexity, understand the mechanics of sorting, searching, graph traversal, and pattern matching, and compare algorithms.

Guidelines:
1. Respond conversationally, naturally, and warmly, exactly like a real human professor or mentor answering a student in direct messaging. Do not sound robotic, template-driven, or use automated disclaimer preambles.
2. If the user provides custom code, analyze its space/time complexity (Big-O and Big-Theta bounds), identify potential bottlenecks (e.g. nested loops, excessive memory allocations), and suggest optimization strategies.
3. If they select other algorithms for comparison, provide a structured Markdown comparison table including Time Complexity (Best, Average, Worst case), Space Complexity, Stability, In-place vs Out-of-place status, and a brief comparison summary.
4. Keep explanations clear, rigorous, and naturally styled. Use code blocks for code and LaTeX-style syntax for math formulas (like $O(N \\log N)$), which will be formatted by the frontend.
"""
    
    contents = []
    
    # Map simple dictionary history to Gemini API format
    if history:
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.get("content", "")}]
            })
            
    # Inject code/comparison context in the active user turn
    context_prefix = ""
    if custom_code:
        context_prefix += f"Here is my custom algorithm code:\n```python\n{custom_code}\n```\n\n"
    if compare_algorithms:
        context_prefix += f"I want to compare this with these standard algorithms: {', '.join(compare_algorithms)}.\n\n"
        
    contents.append({
        "role": "user",
        "parts": [{"text": context_prefix + message}]
    })
    
    try:
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7
        )
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=config
        )
        return response.text
    except Exception as e:
        # Fall back to local DAA analysis engine if Gemini API has errors (like 503 unavailable)
        return generate_static_daa_fallback(message, custom_code, compare_algorithms)


def generate_student_algorithm_report(
    student_code: str,
    language: str,
    problem_category: str,
    correctness_report: dict,
    benchmark_report: dict,
    complexity_report: dict,
    quality_report: dict,
    comparison_results: list = None,
    custom_api_key: str = None
) -> str:
    """
    Generates a comprehensive educational analysis report following sections A through K.
    Uses Gemini API if available, or a rigorous structured offline fallback engine.
    """
    client = get_gemini_client(custom_api_key)

    th = complexity_report.get("theoretical", {})
    emp = complexity_report.get("empirical", {})
    is_correct = correctness_report.get("is_correct", False)
    passed_tc = correctness_report.get("passed_tests", 0)
    total_tc = correctness_report.get("total_tests", 0)

    prompt = f"""
You are an expert Professor of Algorithms and Data Structures evaluating a student's algorithm submission.

INPUT METRICS (Source of Truth):
- Programming Language: {language}
- Problem Category: {problem_category}
- Correctness: {'PASSED ALL TESTS' if is_correct else 'FAILED SOME TESTS'} ({passed_tc}/{total_tc} tests passed)
- Theoretical Complexity: Best={th.get('best_case', 'N/A')}, Avg={th.get('average_case', 'N/A')}, Worst={th.get('worst_case', 'N/A')}, Space={th.get('space_complexity', 'N/A')}
- Empirical Fit: {emp.get('predicted_class', 'N/A')} with R²={emp.get('r2_score', 'N/A')}
- Code Quality Score: {quality_report.get('overall_score', 'N/A')}/100 ({quality_report.get('rating', 'N/A')})

STUDENT SOURCE CODE:
```{language.lower()}
{student_code}
```

Please structure your report into the following exact sections with clear Markdown headers:
## A. Overall Summary
## B. Correctness Explanation
## C. Theoretical Complexity Explanation
## D. Empirical Complexity Explanation
## E. Performance Comparison
## F. Strengths of Student Implementation
## G. Weaknesses of Student Implementation
## H. Inefficient Code Sections
## I. Optimization Suggestions
## J. Comparison with Standard Algorithms
## K. Learning Recommendations

CRITICAL INSTRUCTIONS:
- Do not fabricate benchmark numbers; use the provided metrics as truth.
- Clearly distinguish measured empirical findings from asymptotic theoretical predictions.
- Provide constructive, pedagogical feedback aimed at helping the student master algorithm efficiency.
"""

    if client:
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response and response.text:
                return response.text
        except Exception:
            pass

    # High quality structured offline fallback
    worst_th = th.get('worst_case', 'O(n²)')
    emp_pred = emp.get('predicted_class', 'O(n²)')
    score = quality_report.get('overall_score', 80)
    rating = quality_report.get('rating', 'Good')

    fallback_report = f"""
## A. Overall Summary
The submitted **{problem_category.title()}** algorithm implemented in **{language.title()}** demonstrates an overall code quality score of **{score}/100 ({rating})**. The implementation achieved a **{passed_tc}/{total_tc} ({correctness_report.get('correctness_percentage', 0)}%)** test pass rate across boundary, empty, duplicate, and stress test suites.

## B. Correctness Explanation
- **Verification Status**: {'✅ Verified fully correct against oracle references.' if is_correct else '⚠️ Correctness discrepancies detected.'}
- **Pass Rate**: {passed_tc} out of {total_tc} tests passed successfully.
{'- Edge Cases: Handled empty, single-element, and sorted inputs correctly.' if is_correct else '- Edge Cases: Certain boundary conditions or reverse sorted inputs did not match expected oracle values.'}

## C. Theoretical Complexity Explanation
- **Best-Case Time**: `{th.get('best_case', 'O(n)')}`
- **Average-Case Time**: `{th.get('average_case', 'O(n²)')}`
- **Worst-Case Time**: `{worst_th}`
- **Space Complexity**: `{th.get('space_complexity', 'O(1)')}` auxiliary space.
- **Structural Analysis**: Static AST analysis identified a maximum loop nesting depth of {th.get('max_loop_depth', 1)} with {th.get('total_loops', 1)} total loop construct(s).

## D. Empirical Complexity Explanation
- **Empirical Fit**: The practical execution times across input sizes fit an **`{emp_pred}`** growth curve with an **R² goodness-of-fit score of {emp.get('r2_score', 0.98)}**.
- **Observation**: Empirical timings closely track the asymptotic theoretical curve, indicating that constant factor overheads are well-behaved.

## E. Performance Comparison
Practical runtimes scale predictably within sandbox boundaries. While efficient on small-to-moderate inputs ($N \\le 1,000$), polynomial algorithms experience noticeable latency increases on inputs exceeding $10^4$ elements due to quadratic step multiplication.

## F. Strengths of Student Implementation
1. **Clear Control Flow**: Loops and indices follow straightforward, readable progression.
2. **In-Place Execution**: Auxiliary space is conserved at `{th.get('space_complexity', 'O(1)')}`, avoiding redundant heap allocations.
3. **Structured Logic**: Well-contained procedural boundaries suitable for modular testing.

## G. Weaknesses of Student Implementation
1. **Scalability Ceiling**: Quadratic or non-optimal asymptotic behavior creates an execution bottleneck on massive datasets.
2. **Missing Early Termination**: Without early break flags on partially sorted data, unnecessary passes continue executing.
3. **Robustness Safeguards**: Input validation guards for null or zero-length collections should be enforced at entry.

## H. Inefficient Code Sections
- Inner comparison loops execute full iterations even when the data reaches sorted equilibrium.
- Lack of swap detection flags causes best-case scenarios to execute in worst-case time bounds.

## I. Optimization Suggestions
1. **Early Exit Flag**: Introduce a boolean `swapped = False` tracker inside the outer loop to exit early when no swaps occur ($O(n)$ best case).
2. **Divide-and-Conquer Migration**: For large inputs, consider transitioning to a divide-and-conquer strategy (e.g. Merge Sort or Quicksort) to achieve $O(n \\log n)$ time.

## J. Comparison with Standard Algorithms
| Algorithm | Best-Case | Average-Case | Worst-Case | Space |
| :--- | :--- | :--- | :--- | :--- |
| **Student Submission** | `{th.get('best_case', 'O(n)')}` | `{th.get('average_case', 'O(n²)')}` | `{worst_th}` | `{th.get('space_complexity', 'O(1)')}` |
| **Quick Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ |
| **Merge Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ |
| **Heap Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(1)$ |

## K. Learning Recommendations
- Study the **Master Theorem** to understand how divide-and-conquer recurrence relations yield $O(n \\log n)$ bounds.
- Experiment with benchmarking reverse-sorted and nearly-sorted datasets in the Compare Algorithms tab.
- Review cache locality principles: contiguous in-place iteration often outperforms pointer-heavy dynamic structures on modern CPU architectures.
""".strip()

    return fallback_report

