import React, { useRef, useEffect } from 'react';
import { Code, Trash2, Copy, Check, FileCode, Sparkles } from 'lucide-react';

export const STARTER_TEMPLATES = {
  sorting: {
    python: `def bubble_sort(arr):
    """
    In-place bubble sort with early termination.
    Input: arr (list of integers)
    Output: sorted list of integers
    """
    n = len(arr)
    arr = list(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr
`,
    c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) {
        return 0;
    }
    int *arr = (int *)malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    // Bubble Sort with early exit
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = 1;
            }
        }
        if (!swapped) break;
    }
    // Output sorted numbers
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    free(arr);
    return 0;
}
`,
    cpp: `#include <iostream>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n) || n <= 0) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; i++) {
        std::cin >> arr[i];
    }
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
    for (int i = 0; i < n; i++) {
        std::cout << arr[i] << " ";
    }
    std::cout << "\\n";
    return 0;
}
`,
    java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int tmp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = tmp;
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
        for (int i = 0; i < n; i++) {
            System.out.print(arr[i] + " ");
        }
        System.out.println();
    }
}
`,
    javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    const n = parseInt(input[0], 10);
    const arr = [];
    for (let i = 1; i <= n; i++) {
        arr.push(parseInt(input[i], 10));
    }
    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                const t = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = t;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
    console.log(arr.join(' '));
}

solve();
`
  },
  searching: {
    python: `def binary_search(arr, key):
    """
    Logarithmic binary search on sorted input.
    Input: arr (list of integers), key (target integer)
    Output: 0-based index or -1
    """
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == key:
            return mid
        elif arr[mid] < key:
            low = mid + 1
        else:
            high = mid - 1
    return -1
`,
    cpp: `#include <iostream>
#include <vector>

int main() {
    int n, key;
    if (!(std::cin >> n >> key)) return 0;
    std::vector<int> arr(n);
    for (int i = 0; i < n; i++) std::cin >> arr[i];
    int low = 0, high = n - 1, ans = -1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (arr[mid] == key) { ans = mid; break; }
        else if (arr[mid] < key) low = mid + 1;
        else high = mid - 1;
    }
    std::cout << ans << "\\n";
    return 0;
}
`
  },
  string: {
    python: `def naive_match(text, pattern):
    """
    String matching returning all match start indices.
    """
    n, m = len(text), len(pattern)
    matches = []
    if m == 0 or n < m:
        return matches
    for i in range(n - m + 1):
        if text[i:i + m] == pattern:
            matches.append(i)
    return matches
`
  },
  advanced: {
    python: `def knapsack(values, weights, capacity):
    """
    0/1 Knapsack DP iterative solver.
    """
    n = len(values)
    dp = [0] * (capacity + 1)
    for i in range(n):
        v, w = values[i], weights[i]
        for c in range(capacity, w - 1, -1):
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[capacity]
`
  }
};

export default function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  category = 'sorting',
  readOnly = false
}) {
  const lineNumbersRef = useRef(null);
  const textareaRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  const lines = (code || '').split('\n');
  const lineCount = lines.length;

  // Handle Tab key insertion (4 spaces)
  const handleKeyDown = (e) => {
    if (readOnly) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = () => {
    const catTemplates = STARTER_TEMPLATES[category] || STARTER_TEMPLATES.sorting;
    const sample = catTemplates[language] || catTemplates.python || STARTER_TEMPLATES.sorting.python;
    setCode(sample);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--glass-border)] bg-[#0b0f19] overflow-hidden shadow-xl text-slate-100 font-mono text-sm">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Source Code Editor
          </span>
          {setLanguage && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="ml-2 bg-slate-800 text-indigo-300 text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-sans font-semibold"
            >
              <option value="python">Python 3</option>
              <option value="c">C (Clang / GCC)</option>
              <option value="cpp">C++ 17</option>
              <option value="java">Java (JDK)</option>
              <option value="javascript">JavaScript (Node.js)</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={loadSample}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition cursor-pointer"
              title="Load starter template"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Template</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition cursor-pointer"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {!readOnly && (
            <button
              onClick={() => setCode('')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 transition cursor-pointer"
              title="Clear code"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Main Surface (Line Numbers + Textarea) */}
      <div className="relative flex min-h-[360px] max-h-[560px] overflow-hidden bg-[#070a12]">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="select-none py-4 px-3 text-right bg-[#05080f] text-slate-600 border-r border-slate-800/60 font-mono text-xs overflow-hidden leading-6 min-w-[3.2rem]"
          aria-hidden="true"
        >
          {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        {/* Code Input Surface */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          readOnly={readOnly}
          spellCheck="false"
          placeholder="// Enter or paste your algorithm source code here..."
          className="flex-1 w-full p-4 bg-transparent text-slate-100 placeholder-slate-600 font-mono text-xs leading-6 resize-none focus:outline-none selection:bg-indigo-600/40 overflow-y-auto whitespace-pre tab-4"
        />
      </div>

      {/* Editor Status Bar Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/80 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span>Lines: <strong className="text-slate-300">{lineCount}</strong></span>
          <span>Characters: <strong className="text-slate-300">{code?.length || 0}</strong></span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Sandbox Ready
          </span>
        </div>
        <div className="text-slate-500 text-[10px]">
          Press Tab to indent • 512KB Limit
        </div>
      </div>
    </div>
  );
}

