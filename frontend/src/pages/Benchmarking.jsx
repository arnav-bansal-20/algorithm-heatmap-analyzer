import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

const ALGO_CATEGORIES = {
  "Sorting": {
    "bubble_sort": "Bubble Sort",
    "selection_sort": "Selection Sort",
    "insertion_sort": "Insertion Sort",
    "merge_sort": "Merge Sort",
    "quick_sort": "Quick Sort",
    "heap_sort": "Heap Sort"
  },
  "Searching": {
    "linear_search": "Linear Search",
    "binary_search": "Binary Search"
  },
  "Graph": {
    "bfs": "BFS",
    "dfs": "DFS",
    "dijkstra": "Dijkstra's Algorithm",
    "topological_sort": "Topological Sort"
  },
  "String Matching": {
    "naive_pattern_matching": "Naive Pattern Matching",
    "kmp_search": "KMP",
    "horspool_search": "Horspool Matching",
    "boyer_moore_search": "Boyer-Moore"
  },
  "Advanced": {
    "knapsack": "0/1 Knapsack (DP)",
    "n_queens": "N-Queens (Backtracking)"
  }
};

const DATASET_TYPES = {
  "random": "Random Dataset",
  "sorted": "Sorted Dataset",
  "reverse_sorted": "Reverse Sorted Dataset",
  "nearly_sorted": "Nearly Sorted Dataset"
};

const INPUT_SIZES = [10, 100, 1000, 10000, 100000];

export default function Benchmarking({ benchmarkData, setBenchmarkData }) {
  const [selectedAlgos, setSelectedAlgos] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Sorting');
  const [datasetType, setDatasetType] = useState('random');
  const [selectedSizes, setSelectedSizes] = useState([10, 100, 1000]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);

  const terminalEndRef = useRef(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, text, type }]);
  };

  const handleSelectAll = (category) => {
    const algos = Object.keys(ALGO_CATEGORIES[category]);
    const allSelected = algos.every(a => selectedAlgos.includes(a));

    if (allSelected) {
      setSelectedAlgos(prev => prev.filter(a => !algos.includes(a)));
    } else {
      setSelectedAlgos(prev => [...new Set([...prev, ...algos])]);
    }
  };

  const handleSelectAlgo = (algo) => {
    if (selectedAlgos.includes(algo)) {
      setSelectedAlgos(prev => prev.filter(a => a !== algo));
    } else {
      setSelectedAlgos(prev => [...prev, algo]);
    }
  };

  const handleSelectSize = (size) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length > 1) {
        setSelectedSizes(prev => prev.filter(s => s !== size));
      }
    } else {
      setSelectedSizes(prev => [...prev, size].sort((a, b) => a - b));
    }
  };

  const startBenchmark = async () => {
    if (selectedAlgos.length === 0) {
      alert("Please select at least one algorithm to benchmark.");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setBenchmarkData([]); // Reset parent state for new runs

    addLog("🚀 [SYSTEM] Initializing DAA Benchmarking Suite...", "system");
    addLog(`[CONFIG] Dataset: ${DATASET_TYPES[datasetType]} | Target sizes: ${selectedSizes.join(', ')}`, "info");
    addLog(`[CONFIG] Total algorithms selected: ${selectedAlgos.length}`, "info");

    const results = [];
    let completedSteps = 0;
    const totalSteps = selectedAlgos.length;

    for (let i = 0; i < selectedAlgos.length; i++) {
      const algoKey = selectedAlgos[i];
      const algoName = getAlgoDisplayName(algoKey);

      addLog(`⚡ [BENCHMARK] Starting category suite for ${algoName}...`, "info");

      try {
        addLog(`[API] Posting benchmark task for ${algoName}...`, "info");

        // Execute this specific algorithm across all selected sizes
        const data = await api.runBenchmark([algoKey], datasetType, selectedSizes);

        if (data && data.results) {
          data.results.forEach(res => {
            results.push(res);
            if (res.status === 'success' || res.status === 'slow') {
              addLog(`  [SUCCESS] N=${res.size} -> Time: ${res.time_ms} ms | Ops: ${res.operations?.toLocaleString()} | Memory: ${res.memory_bytes?.toLocaleString()} bytes`, "success");
            } else if (res.status === 'skipped') {
              addLog(`  [WARN] N=${res.size} -> ${res.message || 'Skipped to prevent timeout.'}`, "warning");
            } else {
              addLog(`  [ERROR] N=${res.size} -> ${res.message || 'Unknown execution error.'}`, "error");
            }
          });
        }
      } catch (err) {
        addLog(`❌ [API_ERROR] Failed to run benchmark for ${algoName}: ${err.message}`, "error");
      }

      completedSteps += 1;
      setProgress(Math.round((completedSteps / totalSteps) * 100));
    }

    addLog("🏆 [SYSTEM] Benchmarking sequence completed successfully!", "system");
    setBenchmarkData(results);
    setIsRunning(false);

    // Fire confetti for satisfying success
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  const getAlgoDisplayName = (key) => {
    for (const cat in ALGO_CATEGORIES) {
      if (ALGO_CATEGORIES[cat][key]) return ALGO_CATEGORIES[cat][key];
    }
    return key;
  };

  return (
    <div className="page-transition space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Algorithm Benchmarking</h1>
          <p className="text-[var(--text-secondary)] text-sm font-semibold">Run real-time performance benchmark tests on your CPU</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Parameters Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--sidebar-active-text)]" /> Benchmark Configuration
            </h3>

            {/* Category Selector Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-secondary)]">Algorithm Category</label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                disabled={isRunning}
                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {Object.keys(ALGO_CATEGORIES).map(cat => (
                  <option key={cat} value={cat} className="bg-slate-900 text-slate-100">{cat}</option>
                ))}
              </select>
            </div>

            {/* Algorithm Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="block text-sm font-semibold text-[var(--text-secondary)]">Select Algorithms</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(activeCategory)}
                  disabled={isRunning}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-400 disabled:opacity-50 cursor-pointer"
                >
                  {Object.keys(ALGO_CATEGORIES[activeCategory]).every(a => selectedAlgos.includes(a)) ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-1">
                  {Object.entries(ALGO_CATEGORIES[activeCategory]).map(([key, name]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all ${selectedAlgos.includes(key)
                          ? 'bg-[var(--sidebar-active-bg)] border-[var(--sidebar-active-text)] text-[var(--sidebar-active-text)] font-semibold'
                          : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAlgos.includes(key)}
                        onChange={() => handleSelectAlgo(key)}
                        disabled={isRunning}
                        className="accent-indigo-600 w-4 h-4"
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Dataset Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-secondary)]">Dataset Distribution</label>
              <select
                value={datasetType}
                onChange={(e) => setDatasetType(e.target.value)}
                disabled={isRunning}
                className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {Object.entries(DATASET_TYPES).map(([key, val]) => (
                  <option key={key} value={key} className="bg-slate-900 text-slate-100">{val}</option>
                ))}
              </select>
            </div>

            {/* Input Size Selection */}
            <div className="space-y-2">
              <span className="block text-sm font-semibold text-[var(--text-secondary)]">Input Sizes (N)</span>
              <div className="flex flex-wrap gap-2">
                {INPUT_SIZES.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSelectSize(size)}
                    disabled={isRunning}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${selectedSizes.includes(size)
                        ? 'bg-[var(--sidebar-active-bg)] border-[var(--sidebar-active-text)] text-[var(--sidebar-active-text)] font-bold shadow-xs'
                        : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]'
                      }`}
                  >
                    {size.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={startBenchmark}
                disabled={isRunning || selectedAlgos.length === 0}
                className="w-full flex items-center justify-center gap-2 btn-neon rounded-xl py-3 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" /> Run Benchmark Suite
              </button>
            </div>
          </div>
        </div>

        {/* Live Terminal & Results Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Simulated Terminal */}
          <div className="glass-card-no-hover border border-[var(--glass-border)] rounded-2xl overflow-hidden shadow-md flex flex-col h-[320px]">
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-300 font-mono">DAA Benchmarking Console</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 p-4 font-mono text-xs overflow-y-auto space-y-2 select-text">
              {logs.length === 0 ? (
                <div className="text-slate-500 h-full flex items-center justify-center flex-col gap-2">
                  <TerminalIcon className="w-8 h-8 text-slate-700 animate-pulse" />
                  <span>Console idle. Configure parameters and click Run.</span>
                </div>
              ) : (
                logs.map((log, idx) => {
                  let color = 'text-sky-400';
                  if (log.type === 'system') color = 'text-pink-400 font-bold';
                  if (log.type === 'success') color = 'text-emerald-400';
                  if (log.type === 'warning') color = 'text-amber-400';
                  if (log.type === 'error') color = 'text-rose-400 font-bold';
                  return (
                    <div key={idx} className={`${color} leading-relaxed`}>
                      <span className="text-slate-600 mr-2">[{log.time}]</span>
                      {log.text}
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>

            {isRunning && (
              <div className="bg-slate-900 border-t border-slate-800 p-2 px-4 flex items-center gap-3">
                <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-slate-300 font-mono">{progress}%</span>
              </div>
            )}
          </div>

          {/* Results Summary Table */}
          <div className="glass-card rounded-2xl p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3 mb-4">
              Real-time Telemetry Dashboard
            </h3>

            {benchmarkData.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-secondary)] text-sm">
                No telemetry data available. Start a benchmark to populate results.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
                      <th className="py-3 px-2">Algorithm</th>
                      <th className="py-3 px-2 text-right">Input Size (N)</th>
                      <th className="py-3 px-2 text-right">Time (ms)</th>
                      <th className="py-3 px-2 text-right">Operations Count</th>
                      <th className="py-3 px-2 text-right">Peak Memory</th>
                      <th className="py-3 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-[var(--glass-border)] hover:bg-[var(--table-hover-bg)] transition-colors"
                      >
                        <td className="py-3.5 px-2 font-bold text-[var(--text-primary)]">
                          {getAlgoDisplayName(row.algorithm)}
                        </td>
                        <td className="py-3.5 px-2 text-right font-mono text-[var(--text-secondary)] font-semibold">
                          {row.size.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-2 text-right font-mono text-[var(--text-primary)] font-bold">
                          {row.time_ms !== null ? `${row.time_ms.toFixed(3)}` : '-'}
                        </td>
                        <td className="py-3.5 px-2 text-right font-mono text-[var(--text-primary)]">
                          {row.operations !== null && row.operations !== undefined ? row.operations.toLocaleString() : '-'}
                        </td>
                        <td className="py-3.5 px-2 text-right font-mono text-[var(--text-secondary)] text-xs">
                          {row.memory_bytes !== null && row.memory_bytes !== undefined ? `${(row.memory_bytes / 1024).toFixed(1)} KB` : '-'}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${row.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                              row.status === 'slow' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25' :
                                row.status === 'skipped' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                                  'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                            }`}>
                            {row.status === 'success' && <ShieldCheck className="w-3.5 h-3.5" />}
                            {row.status === 'slow' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                            {row.status === 'skipped' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                            {row.status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
