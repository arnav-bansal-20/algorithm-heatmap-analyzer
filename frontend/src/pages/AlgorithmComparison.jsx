import React, { useState, useEffect } from 'react';
import { BarChart3, Award, Sparkles, AlertCircle, Cpu, Zap } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';

const ALGO_DISPLAY_NAMES = {
  "bubble_sort": "Bubble Sort",
  "selection_sort": "Selection Sort",
  "insertion_sort": "Insertion Sort",
  "merge_sort": "Merge Sort",
  "quick_sort": "Quick Sort",
  "heap_sort": "Heap Sort",
  "linear_search": "Linear Search",
  "binary_search": "Binary Search",
  "bfs": "BFS",
  "dfs": "DFS",
  "dijkstra": "Dijkstra's Algorithm",
  "topological_sort": "Topological Sort",
  "naive_pattern_matching": "Naive Match",
  "kmp_search": "KMP",
  "boyer_moore_search": "Boyer-Moore",
  "knapsack": "0/1 Knapsack (DP)",
  "n_queens": "N-Queens (Backtracking)"
};

const CATEGORIES = {
  "sorting": "Sorting",
  "searching": "Searching",
  "graph": "Graph Algorithms",
  "string": "String Match",
  "advanced": "Advanced (DP/Backtrack)"
};

const ALGO_BY_CATEGORY = {
  "sorting": ["bubble_sort", "selection_sort", "insertion_sort", "merge_sort", "quick_sort", "heap_sort"],
  "searching": ["linear_search", "binary_search"],
  "graph": ["bfs", "dfs", "dijkstra", "topological_sort"],
  "string": ["naive_pattern_matching", "kmp_search", "boyer_moore_search"],
  "advanced": ["knapsack", "n_queens"]
};

export default function AlgorithmComparison({ benchmarkData }) {
  const [selectedCategory, setSelectedCategory] = useState('sorting');
  const [metricTab, setMetricTab] = useState('time_ms'); // time_ms | operations | memory
  const [leaderboardSize, setLeaderboardSize] = useState(1000);
  
  // Recommender states
  const [recSize, setRecSize] = useState(1000);
  const [recDataset, setRecDataset] = useState('random');
  const [recMemory, setRecMemory] = useState('high');
  const [recommendation, setRecommendation] = useState(null);
  const [isRecLoading, setIsRecLoading] = useState(false);

  // Filter benchmark data for the selected category
  const catAlgos = ALGO_BY_CATEGORY[selectedCategory];
  const catRuns = benchmarkData.filter(d => catAlgos.includes(d.algorithm));
  const sizes = [...new Set(catRuns.map(d => d.size))].sort((a, b) => a - b);
  const availableAlgos = [...new Set(catRuns.map(d => d.algorithm))];

  useEffect(() => {
    if (sizes.length > 0 && !sizes.includes(leaderboardSize)) {
      setLeaderboardSize(sizes[0]);
    }
  }, [selectedCategory, sizes]);

  // Fetch recommendation
  const getRecommendation = async () => {
    setIsRecLoading(true);
    try {
      const res = await api.getRecommendation(selectedCategory, recSize, recDataset, recMemory);
      setRecommendation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRecLoading(false);
    }
  };

  useEffect(() => {
    getRecommendation();
  }, [selectedCategory, recSize, recDataset, recMemory]);

  if (benchmarkData.length === 0) {
    return (
      <div className="page-transition glass-card rounded-2xl p-12 text-center text-[var(--text-secondary)] space-y-4">
        <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto animate-bounce" />
        <h3 className="text-xl font-bold text-[var(--text-primary)]">No Benchmark Data Found</h3>
        <p className="max-w-md mx-auto text-sm text-[var(--text-secondary)]">
          Please run benchmarks first on the <b>Benchmarking</b> page. Leaderboards, charts, and metrics are populated after running simulations.
        </p>
      </div>
    );
  }

  // Leaderboard ranking calculation
  const getLeaderboard = () => {
    const sizeRuns = catRuns.filter(d => d.size === leaderboardSize && d.status !== 'skipped');
    
    // Sort based on speed
    return [...sizeRuns].sort((a, b) => {
      if (a.time_ms === null) return 1;
      if (b.time_ms === null) return -1;
      return a.time_ms - b.time_ms;
    });
  };

  const leaderboard = getLeaderboard();

  // Multi-metric charts config
  const chartData = {
    labels: sizes.map(s => s.toLocaleString()),
    datasets: availableAlgos.map((algo, index) => {
      const colors = [
        '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', 
        '#ec4899', '#3b82f6', '#14b8a6', '#6366f1', '#a855f7'
      ];
      const color = colors[index % colors.length];

      const dataPoints = sizes.map(size => {
        const item = catRuns.find(d => d.algorithm === algo && d.size === size);
        if (!item || item.status === 'skipped') return null;
        if (metricTab === 'time_ms') return item.time_ms;
        if (metricTab === 'operations') return item.operations;
        if (metricTab === 'memory') return item.memory_bytes / 1024.0; // KB
        return null;
      });

      return {
        label: ALGO_DISPLAY_NAMES[algo] || algo,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color + '15',
        borderWidth: 2,
        tension: 0.1,
        spanGaps: true,
        pointBackgroundColor: color,
      };
    })
  };

  const getMetricLabel = () => {
    if (metricTab === 'time_ms') return 'Execution Time (ms) - Log scale';
    if (metricTab === 'operations') return 'Operations Count - Log scale';
    return 'Memory Footprint (KB) - Log scale';
  };

  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.06)';

  return (
    <div className="page-transition space-y-8">
      {/* Category header tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Algorithm Comparison</h1>
          <p className="text-[var(--text-secondary)] text-sm font-semibold">Compare metrics side-by-side and query constraints recommender</p>
        </div>

        <div className="flex flex-wrap bg-[var(--glass-bg)] border border-[var(--glass-border)] p-1 rounded-xl shadow-xs gap-1">
          {Object.entries(CATEGORIES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedCategory === key 
                  ? 'bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-xs' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Multi-metric Chart & Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart card */}
          <div className="glass-card rounded-2xl p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--glass-border)] pb-3 mb-6 gap-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-sans">Telemetry Comparison Curves</h3>
              
              <div className="flex bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg p-0.5 text-[10px] font-bold">
                <button
                  onClick={() => setMetricTab('time_ms')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    metricTab === 'time_ms' ? 'bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Time
                </button>
                <button
                  onClick={() => setMetricTab('operations')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    metricTab === 'operations' ? 'bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Operations
                </button>
                <button
                  onClick={() => setMetricTab('memory')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    metricTab === 'memory' ? 'bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Memory
                </button>
              </div>
            </div>

            {sizes.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-secondary)] text-sm">
                No benchmarking datasets found for this category.
              </div>
            ) : (
              <div className="h-[320px]">
                <Line 
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { 
                        grid: { color: gridColor },
                        ticks: { color: textColor },
                        title: { display: true, text: 'Input Size (N)', color: textColor }
                      },
                      y: {
                        type: 'logarithmic',
                        grid: { color: gridColor },
                        ticks: { 
                          color: textColor,
                          callback: function(value) {
                            const log10 = Math.log10(value);
                            if (Math.abs(log10 - Math.round(log10)) < 1e-9) {
                              if (metricTab === 'time_ms') return value + ' ms';
                              if (metricTab === 'operations') return value.toLocaleString();
                              return value + ' KB';
                            }
                            return null;
                          }
                        },
                        title: { display: true, text: getMetricLabel(), font: { weight: 'bold' }, color: textColor }
                      }
                    },
                    plugins: {
                      legend: { 
                        position: 'bottom', 
                        labels: { boxWidth: 10, usePointStyle: true, color: textColor } 
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Leaderboard card */}
          <div className="glass-card rounded-2xl p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--glass-border)] pb-3 mb-4 gap-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Efficiency Leaderboard
              </h3>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Select N:</label>
                <select
                  value={leaderboardSize}
                  onChange={(e) => setLeaderboardSize(Number(e.target.value))}
                  className="bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-xl px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none"
                >
                  {sizes.map(size => (
                    <option key={size} value={size} className="bg-slate-900 text-slate-100">N = {size.toLocaleString()}</option>
                  ))}
                </select>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-secondary)] text-sm">
                No benchmark runs found for size N = {leaderboardSize.toLocaleString()}.
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((item, idx) => {
                  const rank = idx + 1;
                  return (
                    <div 
                      key={item.algorithm}
                      className="flex items-center justify-between p-3.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          rank === 1 ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/40' :
                          rank === 2 ? 'bg-slate-500/20 text-slate-300' :
                          rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-slate-500/10 text-[var(--text-secondary)]'
                        }`}>
                          {rank}
                        </div>
                        <span className="font-bold text-[var(--text-primary)] text-sm">
                          {ALGO_DISPLAY_NAMES[item.algorithm] || item.algorithm}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 font-mono text-xs text-[var(--text-secondary)]">
                        <span>Time: <b className="text-[var(--text-primary)]">{item.time_ms.toFixed(3)} ms</b></span>
                        <span className="hidden md:inline">Ops: <b className="text-[var(--text-primary)]">{item.operations?.toLocaleString()}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Constraint-based Recommender Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-5 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--neon-cyan)]" /> Constraint Recommender
            </h3>

            {/* Selector controls */}
            <div className="space-y-4 text-xs font-semibold text-[var(--text-secondary)]">
              <div className="space-y-1.5">
                <label className="block text-[var(--text-secondary)]">Expected Dataset Size (N)</label>
                <select
                  value={recSize}
                  onChange={(e) => setRecSize(Number(e.target.value))}
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-xl px-3 py-2 font-semibold focus:outline-none"
                >
                  <option value={10} className="bg-slate-900 text-slate-100">10 elements (Tiny)</option>
                  <option value={100} className="bg-slate-900 text-slate-100">100 elements (Small)</option>
                  <option value={1000} className="bg-slate-900 text-slate-100">1,000 elements (Medium)</option>
                  <option value={10000} className="bg-slate-900 text-slate-100">10,000 elements (Large)</option>
                  <option value={100000} className="bg-slate-900 text-slate-100">100,000 elements (Huge)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[var(--text-secondary)]">Data Distribution State</label>
                <select
                  value={recDataset}
                  onChange={(e) => setRecDataset(e.target.value)}
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-xl px-3 py-2 font-semibold focus:outline-none"
                >
                  <option value="random" className="bg-slate-900 text-slate-100">Randomly Ordered</option>
                  <option value="sorted" className="bg-slate-900 text-slate-100">Fully Sorted</option>
                  <option value="reverse_sorted" className="bg-slate-900 text-slate-100">Reverse Sorted (Sorted Desc)</option>
                  <option value="nearly_sorted" className="bg-slate-900 text-slate-100">Nearly Sorted (10% swapped)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[var(--text-secondary)]">Memory Budget Limit</label>
                <select
                  value={recMemory}
                  onChange={(e) => setRecMemory(e.target.value)}
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-xl px-3 py-2 font-semibold focus:outline-none"
                >
                  <option value="high" className="bg-slate-900 text-slate-100">High Budget (Any O(N) space ok)</option>
                  <option value="medium" className="bg-slate-900 text-slate-100">Medium Budget (O(log N) or less)</option>
                  <option value="low" className="bg-slate-900 text-slate-100">Low Budget (Strict O(1) space limit)</option>
                </select>
              </div>
            </div>

            {/* Recommendation Result Card */}
            {isRecLoading ? (
              <div className="text-center py-6 text-xs text-[var(--text-secondary)]">Computing recommendation...</div>
            ) : recommendation ? (
              <div className="bg-[var(--sidebar-active-bg)] border border-[var(--glass-border)] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                    <Zap className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--sidebar-active-text)] font-bold uppercase tracking-wider block">Recommended Selection</span>
                    <h4 className="font-extrabold text-[var(--text-primary)] text-lg">
                      {recommendation.recommended_algorithm}
                    </h4>
                  </div>
                </div>

                {/* Rationale Bullet points */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider block">Rationale Analysis</span>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc list-inside">
                    {recommendation.rationale.map((text, idx) => (
                      <li key={idx} className="leading-relaxed pl-1 -indent-4 list-none flex items-start gap-1">
                        <span className="text-[var(--sidebar-active-text)] font-bold mt-0.5">•</span>
                        <span className="text-[var(--text-primary)]">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Alternatives */}
                {recommendation.alternatives?.length > 0 && (
                  <div className="pt-3 border-t border-[var(--glass-border)] flex flex-wrap gap-1.5 items-center text-[10px]">
                    <span className="text-[var(--text-secondary)] font-bold uppercase mr-1">Backup Options:</span>
                    {recommendation.alternatives.map(name => (
                      <span key={name} className="bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] px-2 py-0.5 rounded-md font-semibold">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
