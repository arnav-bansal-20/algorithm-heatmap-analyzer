import sys
import heapq
from collections import deque

# Increase recursion depth to avoid stack overflows on recursive algorithms
sys.setrecursionlimit(200000)

class Tracker:
    def __init__(self):
        self.comparisons = 0
        self.swaps = 0
        self.operations = 0
        self.recursion_depth = 0
        self.max_recursion_depth = 0

    def inc_comparisons(self, n=1):
        self.comparisons += n
        self.operations += n

    def inc_swaps(self, n=1):
        self.swaps += n
        self.operations += n

    def inc_operations(self, n=1):
        self.operations += n

    def enter_recursion(self):
        self.recursion_depth += 1
        if self.recursion_depth > self.max_recursion_depth:
            self.max_recursion_depth = self.recursion_depth

    def exit_recursion(self):
        self.recursion_depth -= 1


# ==========================================
# 1. SORTING ALGORITHMS
# ==========================================
def bubble_sort(arr, tracker: Tracker):
    n = len(arr)
    # Work on a copy
    arr = list(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            tracker.inc_comparisons()
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                tracker.inc_swaps()
                swapped = True
        if not swapped:
            break
    return arr


def selection_sort(arr, tracker: Tracker):
    n = len(arr)
    arr = list(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            tracker.inc_comparisons()
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
            tracker.inc_swaps()
    return arr


def insertion_sort(arr, tracker: Tracker):
    n = len(arr)
    arr = list(arr)
    for i in range(1, n):
        key = arr[i]
        j = i - 1
        while j >= 0:
            tracker.inc_comparisons()
            if arr[j] > key:
                arr[j + 1] = arr[j]
                tracker.inc_swaps()
                j -= 1
            else:
                break
        arr[j + 1] = key
        tracker.inc_swaps()
    return arr


def merge_sort(arr, tracker: Tracker):
    tracker.enter_recursion()
    n = len(arr)
    
    if n <= 1:
        tracker.exit_recursion()
        return arr

    mid = n // 2
    left = merge_sort(arr[:mid], tracker)
    right = merge_sort(arr[mid:], tracker)

    result = []
    i = j = 0
    left_len, right_len = len(left), len(right)
    
    while i < left_len and j < right_len:
        tracker.inc_comparisons()
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
        tracker.inc_swaps()

    while i < left_len:
        result.append(left[i])
        i += 1
        tracker.inc_swaps()

    while j < right_len:
        result.append(right[j])
        j += 1
        tracker.inc_swaps()

    tracker.exit_recursion()
    return result


def quick_sort(arr, tracker: Tracker):
    arr = list(arr)
    
    def _quick_sort(items, low, high):
        if low < high:
            tracker.enter_recursion()
            p_idx = partition(items, low, high)
            _quick_sort(items, low, p_idx - 1)
            _quick_sort(items, p_idx + 1, high)
            tracker.exit_recursion()

    def partition(items, low, high):
        # Middle-of-three or simple middle pivot to prevent O(N^2) behavior on sorted arrays
        mid = (low + high) // 2
        items[mid], items[high] = items[high], items[mid]
        pivot = items[high]
        tracker.inc_swaps()

        i = low - 1
        for j in range(low, high):
            tracker.inc_comparisons()
            if items[j] < pivot:
                i += 1
                items[i], items[j] = items[j], items[i]
                tracker.inc_swaps()
        
        items[i + 1], items[high] = items[high], items[i + 1]
        tracker.inc_swaps()
        return i + 1

    _quick_sort(arr, 0, len(arr) - 1)
    return arr


def heap_sort(arr, tracker: Tracker):
    arr = list(arr)
    n = len(arr)

    def heapify(items, size, idx):
        tracker.enter_recursion()
        largest = idx
        left = 2 * idx + 1
        right = 2 * idx + 2

        if left < size:
            tracker.inc_comparisons()
            if items[left] > items[largest]:
                largest = left

        if right < size:
            tracker.inc_comparisons()
            if items[right] > items[largest]:
                largest = right

        if largest != idx:
            items[idx], items[largest] = items[largest], items[idx]
            tracker.inc_swaps()
            heapify(items, size, largest)
        tracker.exit_recursion()

    # Build max heap
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)

    # Extract elements one by one
    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]
        tracker.inc_swaps()
        heapify(arr, i, 0)

    return arr


# ==========================================
# 2. SEARCHING ALGORITHMS
# ==========================================

def linear_search(arr, key, tracker: Tracker):
    for i in range(len(arr)):
        tracker.inc_comparisons()
        if arr[i] == key:
            return i
    return -1


def binary_search(arr, key, tracker: Tracker):
    low = 0
    high = len(arr) - 1
    while low <= high:
        tracker.inc_comparisons()
        mid = (low + high) // 2
        if arr[mid] == key:
            return mid
        elif arr[mid] < key:
            low = mid + 1
        else:
            high = mid - 1
    return -1


# ==========================================
# 3. GRAPH ALGORITHMS
# ==========================================

def bfs(graph, start, tracker: Tracker):
    visited = set()
    queue = deque([start])
    visited.add(start)

    while queue:
        u = queue.popleft()
        tracker.inc_operations()  # Visiting node
        for v, _ in graph.get(u, []):
            tracker.inc_comparisons()  # Traversing edge
            if v not in visited:
                visited.add(v)
                queue.append(v)
    return len(visited)


def dfs(graph, start, tracker: Tracker):
    visited = set()

    def _dfs(u):
        tracker.enter_recursion()
        visited.add(u)
        tracker.inc_operations()  # Visiting node
        for v, _ in graph.get(u, []):
            tracker.inc_comparisons()  # Traversing edge
            if v not in visited:
                _dfs(v)
        tracker.exit_recursion()

    _dfs(start)
    return len(visited)


def dijkstra(graph, start, tracker: Tracker):
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]  # (distance, node)

    while pq:
        curr_dist, u = heapq.heappop(pq)
        tracker.inc_operations()  # Node relaxation step

        if curr_dist > distances[u]:
            continue

        for v, weight in graph.get(u, []):
            tracker.inc_comparisons()  # Checking adjacency edge
            distance = curr_dist + weight
            if distance < distances.get(v, float('inf')):
                distances[v] = distance
                heapq.heappush(pq, (distance, v))
                tracker.inc_swaps()  # Queue update / relaxation
    return distances


# ==========================================
# 4. STRING MATCHING ALGORITHMS
# ==========================================

def naive_pattern_matching(text, pattern, tracker: Tracker):
    n = len(text)
    m = len(pattern)
    matches = []
    
    for i in range(n - m + 1):
        match = True
        for j in range(m):
            tracker.inc_comparisons()
            if text[i + j] != pattern[j]:
                match = False
                break
        if match:
            matches.append(i)
            tracker.inc_swaps()  # Count match found as write/swap operation
    return matches


def kmp_search(text, pattern, tracker: Tracker):
    n = len(text)
    m = len(pattern)
    
    if m == 0:
        return []

    # Preprocess pattern (compute LPS array)
    lps = [0] * m
    j = 0
    i = 1
    while i < m:
        tracker.inc_comparisons()
        if pattern[i] == pattern[j]:
            j += 1
            lps[i] = j
            i += 1
        else:
            if j != 0:
                j = lps[j - 1]
            else:
                lps[i] = 0
                i += 1

    # Search
    matches = []        
    i = 0  # text index
    j = 0  # pattern index
    while i < n:
        tracker.inc_comparisons()
        if text[i] == pattern[j]:
            i += 1
            j += 1

        if j == m:
            matches.append(i - j)
            tracker.inc_swaps()
            j = lps[j - 1]
        elif i < n and text[i] != pattern[j]:
            if j != 0:
                j = lps[j - 1]
            else:
                i += 1
                
    return matches


def boyer_moore_search(text, pattern, tracker: Tracker):
    n = len(text)
    m = len(pattern)
    if m == 0:
        return []

    # 1. Bad Character Heuristic table
    bad_char = {}
    for i in range(m):
        bad_char[pattern[i]] = i

    # 2. Good Suffix Heuristic table
    f = [0] * (m + 1)
    s = [0] * (m + 1)
    
    i_ptr = m
    j_ptr = m + 1
    f[i_ptr] = j_ptr
    while i_ptr > 0:
        while j_ptr <= m and pattern[i_ptr - 1] != pattern[j_ptr - 1]:
            if s[j_ptr] == 0:
                s[j_ptr] = j_ptr - i_ptr
            j_ptr = f[j_ptr]
        i_ptr -= 1
        j_ptr -= 1
        f[i_ptr] = j_ptr
        
    j_ptr = f[0]
    for i_ptr in range(m + 1):
        if s[i_ptr] == 0:
            s[i_ptr] = j_ptr
        if i_ptr == j_ptr:
            j_ptr = f[j_ptr]
            
    good_suffix = [0] * m
    for i_ptr in range(m):
        good_suffix[i_ptr] = s[i_ptr + 1]

    matches = []
    shift = 0
    while shift <= n - m:
        j = m - 1
        while j >= 0:
            tracker.inc_comparisons()
            if pattern[j] == text[shift + j]:
                j -= 1
            else:
                break
        
        if j < 0:
            matches.append(shift)
            tracker.inc_swaps()
            shift += s[0]
        else:
            char = text[shift + j]
            bc_shift = j - bad_char.get(char, -1)
            gs_shift = good_suffix[j]
            shift += max(bc_shift, gs_shift)
            
    return matches


def horspool_search(text, pattern, tracker: Tracker):
    n = len(text)
    m = len(pattern)
    
    if m == 0:
        return []

    # Bad character heuristic shift table (Boyer-Moore-Horspool)
    shift_table = {}
    for i in range(m - 1):
        shift_table[pattern[i]] = m - 1 - i

    matches = []
    i = m - 1
    while i < n:
        k = 0
        while k < m:
            tracker.inc_comparisons()
            if text[i - k] == pattern[m - 1 - k]:
                k += 1
            else:
                break
        
        if k == m:
            matches.append(i - m + 1)
            tracker.inc_swaps()
            i += shift_table.get(text[i], m)
        else:
            char = text[i]
            i += shift_table.get(char, m)

    return matches


# ==========================================
# 5. DYNAMIC PROGRAMMING & BACKTRACKING
# ==========================================

def knapsack(values, weights, capacity, tracker: Tracker):
    n = len(values)
    # Solve 0/1 Knapsack iteratively
    dp = [[0 for _ in range(capacity + 1)] for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        for w in range(1, capacity + 1):
            tracker.inc_comparisons()
            if weights[i-1] <= w:
                tracker.inc_operations()
                dp[i][w] = max(values[i-1] + dp[i-1][w-weights[i-1]], dp[i-1][w])
            else:
                dp[i][w] = dp[i-1][w]
                tracker.inc_swaps()
    return dp[n][capacity]


def n_queens(n: int, tracker: Tracker):
    board = [-1] * n
    solutions = []

    def is_safe(row, col):
        for i in range(row):
            tracker.inc_comparisons()
            if board[i] == col or \
               board[i] - i == col - row or \
               board[i] + i == col + row:
                return False
        return True

    def solve(row):
        tracker.enter_recursion()
        if row == n:
            solutions.append(list(board))
            tracker.inc_swaps()
            tracker.exit_recursion()
            return
        
        for col in range(n):
            tracker.inc_operations()
            if is_safe(row, col):
                board[row] = col
                solve(row + 1)
                board[row] = -1
        tracker.exit_recursion()

    solve(0)
    return len(solutions)


def topological_sort(graph, tracker: Tracker):
    # graph: {u: [(v, weight), ...]}
    # Compute in-degrees
    in_degree = {u: 0 for u in graph}
    # Ensure all neighbor nodes are initialized in in_degree as well
    for u in graph:
        for v, _ in graph[u]:
            if v not in in_degree:
                in_degree[v] = 0
                
    for u in graph:
        for v, _ in graph[u]:
            in_degree[v] += 1

    # Vertices with 0 in-degree in queue
    queue = deque([u for u in in_degree if in_degree[u] == 0])
    result = []

    while queue:
        u = queue.popleft()
        result.append(u)
        tracker.inc_operations()

        # Check if u has outgoing edges
        for v, _ in graph.get(u, []):
            tracker.inc_comparisons()
            if v in in_degree:
                in_degree[v] -= 1
                tracker.inc_swaps()
                if in_degree[v] == 0:
                    queue.append(v)

    return result
