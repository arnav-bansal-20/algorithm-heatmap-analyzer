"""
Trusted Reference Implementations (Oracles) for Correctness Verification.
All expected outputs are generated independently by these verified algorithms.
"""

from typing import List, Dict, Any, Tuple, Union

class ProblemOracle:
    @staticmethod
    def solve_sorting(arr: List[int]) -> List[int]:
        """Reference sorting oracle."""
        return sorted(arr)

    @staticmethod
    def solve_searching(arr: List[int], target: int) -> int:
        """Reference searching oracle. Returns 0-based index or -1."""
        try:
            return arr.index(target)
        except ValueError:
            return -1

    @staticmethod
    def solve_string_matching(text: str, pattern: str) -> List[int]:
        """Reference string matching oracle. Returns list of match start indices."""
        if not pattern:
            return []
        matches = []
        n, m = len(text), len(pattern)
        for i in range(n - m + 1):
            if text[i:i+m] == pattern:
                matches.append(i)
        return matches

    @staticmethod
    def solve_knapsack(values: List[int], weights: List[int], capacity: int) -> int:
        """Reference 0/1 Knapsack oracle."""
        n = len(values)
        dp = [0] * (capacity + 1)
        for i in range(n):
            val = values[i]
            wt = weights[i]
            for w in range(capacity, wt - 1, -1):
                dp[w] = max(dp[w], dp[w - wt] + val)
        return dp[capacity]

    @staticmethod
    def solve_n_queens(n: int) -> int:
        """Reference N-Queens solution count oracle."""
        if n <= 0:
            return 0
        solutions = 0
        cols = set()
        pos_diag = set()
        neg_diag = set()

        def backtrack(r: int):
            nonlocal solutions
            if r == n:
                solutions += 1
                return
            for c in range(n):
                if c in cols or (r + c) in pos_diag or (r - c) in neg_diag:
                    continue
                cols.add(c)
                pos_diag.add(r + c)
                neg_diag.add(r - c)
                backtrack(r + 1)
                cols.remove(c)
                pos_diag.remove(r + c)
                neg_diag.remove(r - c)

        backtrack(0)
        return solutions

    @staticmethod
    def solve_bfs(graph: Dict[int, List[Tuple[int, int]]], start: int = 0) -> int:
        """Reference BFS traversal count oracle."""
        from collections import deque
        visited = set()
        if start not in graph and not graph:
            return 0
        queue = deque([start])
        visited.add(start)
        while queue:
            u = queue.popleft()
            for v, _ in graph.get(u, []):
                if v not in visited:
                    visited.add(v)
                    queue.append(v)
        return len(visited)

    @staticmethod
    def solve_dijkstra(graph: Dict[int, List[Tuple[int, int]]], start: int = 0) -> Dict[int, int]:
        """Reference Dijkstra shortest path oracle."""
        import heapq
        distances = {node: float('inf') for node in graph}
        distances[start] = 0
        pq = [(0, start)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > distances[u]:
                continue
            for v, w in graph.get(u, []):
                new_d = d + w
                if new_d < distances.get(v, float('inf')):
                    distances[v] = new_d
                    heapq.heappush(pq, (new_d, v))
        return {k: (v if v != float('inf') else -1) for k, v in distances.items()}

