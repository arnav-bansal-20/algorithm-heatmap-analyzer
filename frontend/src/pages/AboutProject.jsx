import React from 'react';
import { BookOpen, Code2, Server, HelpCircle, Terminal as TerminalIcon } from 'lucide-react';

const ALGO_THEORY = [
  { name: "Bubble Sort", timeBest: "O(N)", timeAvg: "O(N²)", timeWorst: "O(N²)", space: "O(1)", stable: "Yes" },
  { name: "Selection Sort", timeBest: "O(N²)", timeAvg: "O(N²)", timeWorst: "O(N²)", space: "O(1)", stable: "No" },
  { name: "Insertion Sort", timeBest: "O(N)", timeAvg: "O(N²)", timeWorst: "O(N²)", space: "O(1)", stable: "Yes" },
  { name: "Merge Sort", timeBest: "O(N log N)", timeAvg: "O(N log N)", timeWorst: "O(N log N)", space: "O(N)", stable: "Yes" },
  { name: "Quick Sort", timeBest: "O(N log N)", timeAvg: "O(N log N)", timeWorst: "O(N²)", space: "O(log N)", stable: "No" },
  { name: "Heap Sort", timeBest: "O(N log N)", timeAvg: "O(N log N)", timeWorst: "O(N log N)", space: "O(1)", stable: "No" },
  { name: "Linear Search", timeBest: "O(1)", timeAvg: "O(N)", timeWorst: "O(N)", space: "O(1)", stable: "N/A" },
  { name: "Binary Search", timeBest: "O(1)", timeAvg: "O(log N)", timeWorst: "O(log N)", space: "O(1)", stable: "N/A" },
  { name: "BFS (Breadth First)", timeBest: "O(V + E)", timeAvg: "O(V + E)", timeWorst: "O(V + E)", space: "O(V)", stable: "N/A" },
  { name: "DFS (Depth First)", timeBest: "O(V + E)", timeAvg: "O(V + E)", timeWorst: "O(V + E)", space: "O(V)", stable: "N/A" },
  { name: "Dijkstra's Algorithm", timeBest: "O(E log V)", timeAvg: "O(E log V)", timeWorst: "O(V²)", space: "O(V)", stable: "N/A" },
  { name: "Topological Sort", timeBest: "O(V + E)", timeAvg: "O(V + E)", timeWorst: "O(V + E)", space: "O(V)", stable: "N/A" },
  { name: "Naive String Match", timeBest: "O(N)", timeAvg: "O(N·M)", timeWorst: "O((N-M+1)·M)", space: "O(1)", stable: "N/A" },
  { name: "KMP Search", timeBest: "O(N)", timeAvg: "O(N + M)", timeWorst: "O(N + M)", space: "O(M)", stable: "N/A" },
  { name: "Boyer-Moore", timeBest: "O(N/M)", timeAvg: "O(N + M)", timeWorst: "O(N·M)", space: "O(M)", stable: "N/A" },
  { name: "0/1 Knapsack (DP)", timeBest: "O(N·W)", timeAvg: "O(N·W)", timeWorst: "O(N·W)", space: "O(N·W)", stable: "N/A" },
  { name: "N-Queens (Backtrack)", timeBest: "O(N!)", timeAvg: "O(N!)", timeWorst: "O(N!)", space: "O(N)", stable: "N/A" },
];

export default function AboutProject() {
  return (
    <div className="page-transition space-y-8">
      {/* Introduction Banner */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">About Semester Project</h1>
        <p className="text-[var(--text-secondary)]">Documentation of course curriculum alignment, algorithms theory, and system info</p>
      </div>

      {/* DAA Coursework Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card rounded-2xl p-8 space-y-4 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--neon-violet)]" /> DAA Syllabus Integration
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            This project forms a core lab implementation for the <b>Design and Analysis of Algorithms (DAA)</b> curriculum. It targets the comparative analysis of foundational computer science methodologies:
          </p>
          <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc list-inside">
            <li><b>Divide and Conquer:</b> Merge Sort and Quick Sort, examining pivot selection and recursive stack boundaries.</li>
            <li><b>Decrease and Conquer / Decrease Key:</b> Binary Search and Heap Sort structure.</li>
            <li><b>Greedy Strategy:</b> Dijkstra's single-source shortest path algorithm using adjacency heaps.</li>
            <li><b>String Automata:</b> String matching algorithms comparing Naive comparisons, the KMP Prefix Function, and Boyer-Moore skipping shifts.</li>
            <li><b>Dynamic Programming:</b> 0/1 Knapsack problem comparing operations and recursion space memory structures.</li>
            <li><b>Backtracking:</b> N-Queens puzzle with state configuration search steps.</li>
            <li><b>Graph Traversal:</b> DAG Topological sorting using Kahn's degree reduction algorithm.</li>
          </ul>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-4 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[var(--neon-cyan)]" /> Technology Architecture
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            The platform is built as a decoupled, responsive web application combining modern software engineering and data analytics libraries:
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-[var(--text-primary)] block mb-1">Frontend Stack</span>
              <span className="text-[var(--text-secondary)] block">React 19 (Vite)</span>
              <span className="text-[var(--text-secondary)] block">Tailwind CSS v4</span>
              <span className="text-[var(--text-secondary)] block">Chart.js (React ChartJS 2)</span>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-[var(--text-primary)] block mb-1">Backend Stack</span>
              <span className="text-[var(--text-secondary)] block">Python 3.13 (FastAPI)</span>
              <span className="text-[var(--text-secondary)] block">Scikit-learn Regressors</span>
              <span className="text-[var(--text-secondary)] block">Performance Advisor Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithms Complexity Theory Reference Table */}
      <div className="glass-card rounded-2xl p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
        <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3 mb-5">
          Theoretical Computational Bounds (Reference Index)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-3">Best-Case Time</th>
                <th className="py-2.5 px-3">Average Time</th>
                <th className="py-2.5 px-3">Worst-Case Time</th>
                <th className="py-2.5 px-3">Auxiliary Space</th>
                <th className="py-2.5 px-3">Stable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)] font-mono text-[var(--text-secondary)]">
              {ALGO_THEORY.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--table-hover-bg)]">
                  <td className="py-3 px-3 font-sans font-bold text-[var(--text-primary)]">{row.name}</td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">{row.timeBest}</td>
                  <td className="py-3 px-3 text-indigo-400 font-semibold">{row.timeAvg}</td>
                  <td className="py-3 px-3 text-rose-400 font-semibold">{row.timeWorst}</td>
                  <td className="py-3 px-3">{row.space}</td>
                  <td className="py-3 px-3 font-sans">{row.stable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer system details */}
      <div className="flex flex-col md:flex-row items-center justify-between text-xs text-[var(--text-secondary)] gap-4 border-t border-[var(--glass-border)] pt-6">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-[var(--text-secondary)]" />
          <span>Local Engine: Python 3.13 + Uvicorn server | Node.js 24 + Vite server</span>
        </div>
        <span>© 2026 DAA Semester Project</span>
      </div>
    </div>
  );
}
