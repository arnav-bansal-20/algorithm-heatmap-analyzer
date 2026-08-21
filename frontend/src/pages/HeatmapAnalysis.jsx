import React, { useState } from 'react';
import { Grid, LineChart, BarChart3, Download, HelpCircle, AlertCircle } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale
);

const ALGO_NAMES = {
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
  "horspool_search": "Horspool Match",
  "boyer_moore_search": "Boyer-Moore",
  "knapsack": "0/1 Knapsack (DP)",
  "n_queens": "N-Queens (Backtracking)"
};

export default function HeatmapAnalysis({ benchmarkData }) {
  const [viewMode, setViewMode] = useState('heatmap'); // heatmap | line | bar
  const [scalingMode, setScalingMode] = useState('relative'); // relative (column) | absolute (raw log scale)
  const [selectedBarSize, setSelectedBarSize] = useState(1000);

  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.06)';

  if (benchmarkData.length === 0) {
    return (
      <div className="page-transition glass-card rounded-2xl p-12 text-center text-[var(--text-secondary)] space-y-4">
        <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto animate-bounce" />
        <h3 className="text-xl font-bold text-[var(--text-primary)]">No Benchmark Data Found</h3>
        <p className="max-w-md mx-auto text-sm text-[var(--text-secondary)]">
          Please run benchmarks first on the <b>Benchmarking</b> page. Runtimes, operations, and memory telemetry will automatically populate this heatmap page.
        </p>
      </div>
    );
  }

  // Extract unique algorithms and sizes present in the dataset
  const algos = [...new Set(benchmarkData.map(d => d.algorithm))];
  const sizes = [...new Set(benchmarkData.map(d => d.size))].sort((a, b) => a - b);
  const datasetType = benchmarkData[0]?.dataset_type || 'random';

  // Ensure default selected size exists in the benchmarks
  const currentSelectedSize = sizes.includes(selectedBarSize) ? selectedBarSize : sizes[0];

  // Helper to get benchmark value for cell
  const getCellData = (algo, size) => {
    return benchmarkData.find(d => d.algorithm === algo && d.size === size);
  };

  // Find min/max per column (size) for relative scaling
  const columnLimits = {};
  sizes.forEach(size => {
    const times = benchmarkData
      .filter(d => d.size === size && d.time_ms !== null && d.status !== 'skipped')
      .map(d => d.time_ms);
    if (times.length > 0) {
      columnLimits[size] = {
        min: Math.min(...times),
        max: Math.max(...times)
      };
    } else {
      columnLimits[size] = { min: 0.001, max: 1.0 };
    }
  });

  // Calculate cell HSL background color
  const getCellColor = (item, size) => {
    if (!item || item.status === 'skipped' || item.time_ms === null) {
      return {
        bg: 'rgba(148, 163, 184, 0.08)',
        text: 'text-[var(--text-secondary)]',
        border: 'var(--glass-border)',
        label: 'SKIPPED'
      };
    }
    if (item.status === 'error') {
      return {
        bg: 'rgba(244, 63, 94, 0.15)',
        text: 'text-[var(--neon-rose)] font-bold',
        border: 'rgba(244, 63, 94, 0.3)',
        label: 'ERROR'
      };
    }

    const val = item.time_ms;
    let ratio = 0;

    if (scalingMode === 'relative') {
      const limits = columnLimits[size];
      if (limits && limits.max > limits.min) {
        ratio = (val - limits.min) / (limits.max - limits.min);
      } else {
        ratio = 0;
      }
    } else {
      const minLog = Math.log10(0.0001);
      const maxLog = Math.log10(2000.0);
      const valLog = Math.log10(Math.max(0.0001, val));
      ratio = (valLog - minLog) / (maxLog - minLog);
      ratio = Math.max(0.0, Math.min(1.0, ratio));
    }

    const hue = 120 * (1 - ratio);
    return {
      bg: isLight ? `hsla(${hue}, 95%, 68%, 0.85)` : `hsla(${hue}, 90%, 35%, 0.65)`,
      text: isLight ? 'text-slate-900 font-semibold' : 'text-slate-100 font-semibold',
      border: isLight ? `hsla(${hue}, 95%, 50%, 0.55)` : `hsla(${hue}, 90%, 50%, 0.45)`,
      label: `${val.toFixed(3)} ms`
    };
  };

  // Prepare Chart JS Data
  const lineChartData = {
    labels: sizes.map(s => s.toLocaleString()),
    datasets: algos.map((algo, index) => {
      const colors = [
        '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', 
        '#ec4899', '#3b82f6', '#14b8a6', '#6366f1', '#a855f7'
      ];
      const color = colors[index % colors.length];
      
      const dataPoints = sizes.map(size => {
        const item = getCellData(algo, size);
        return item && item.status !== 'skipped' ? item.time_ms : null;
      });

      return {
        label: ALGO_NAMES[algo] || algo,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color + '15',
        borderWidth: 2.5,
        tension: 0.1,
        spanGaps: true,
        pointBackgroundColor: color,
        pointHoverRadius: 6
      };
    })
  };

  // Bar Chart
  const barChartData = {
    labels: algos.map(algo => ALGO_NAMES[algo] || algo),
    datasets: [{
      label: `Execution Time (ms) at N = ${currentSelectedSize.toLocaleString()}`,
      data: algos.map(algo => {
        const item = getCellData(algo, currentSelectedSize);
        return item && item.status !== 'skipped' ? item.time_ms : 0;
      }),
      backgroundColor: algos.map((_, index) => {
        const colors = [
          'rgba(6, 182, 212, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(244, 63, 94, 0.7)', 
          'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(236, 72, 153, 0.7)'
        ];
        return colors[index % colors.length];
      }),
      borderColor: algos.map((_, index) => {
        const colors = [
          '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#ec4899'
        ];
        return colors[index % colors.length];
      }),
      borderWidth: 1.5
    }]
  };

  // Exporter to CSV
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Algorithm,Input Size,Time (ms),Operations,Memory (bytes),Status\n";
    
    benchmarkData.forEach(row => {
      csvContent += `"${ALGO_NAMES[row.algorithm] || row.algorithm}",${row.size},${row.time_ms !== null ? row.time_ms : ""},${row.operations !== null ? row.operations : ""},${row.memory_bytes !== null ? row.memory_bytes : ""},"${row.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `algorithm_benchmark_${datasetType}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-transition space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Performance Visualizations</h1>
          <p className="text-[var(--text-secondary)] text-sm font-semibold">
            Current Dataset: <span className="text-[var(--neon-violet)] capitalize font-bold">{datasetType.replace("_", " ")}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Toggle buttons */}
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-1 flex gap-1 shadow-xs">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'heatmap' ? 'bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Heatmap
            </button>
            <button
              onClick={() => setViewMode('line')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'line' ? 'bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" /> Line Growth
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'bar' ? 'bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Bar Graph
            </button>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--card-hover-bg)] text-[var(--text-primary)] px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      {viewMode === 'heatmap' && (
        <div className="space-y-6">
          {/* Heatmap Grid */}
          <div className="glass-card rounded-2xl p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--glass-border)] pb-4 mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Complexity Matrix Heatmap</h3>
                <p className="text-xs text-[var(--text-secondary)] font-semibold">Columns are color-scaled to show relative efficiency at each input size</p>
              </div>

              {/* Scaling Mode Toggles */}
              <div className="flex bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg p-0.5 text-[10px] font-bold">
                <button
                  onClick={() => setScalingMode('relative')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    scalingMode === 'relative' ? 'bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-xs' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Size-Relative (Column)
                </button>
                <button
                  onClick={() => setScalingMode('absolute')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    scalingMode === 'absolute' ? 'bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-xs' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Absolute (Logarithmic)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[800px] border border-[var(--glass-border)] rounded-xl overflow-hidden bg-[var(--glass-bg)]">
                {/* Table Header */}
                <div className="grid grid-cols-6 bg-[var(--card-hover-bg)] border-b border-[var(--glass-border)] font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)] py-3.5 px-4">
                  <div className="col-span-1">Algorithm</div>
                  {sizes.map(size => (
                    <div key={size} className="text-right">N = {size.toLocaleString()}</div>
                  ))}
                </div>
                
                {/* Heatmap Cells */}
                <div className="divide-y divide-[var(--glass-border)]">
                  {algos.map(algo => (
                    <div key={algo} className="grid grid-cols-6 items-center px-4 py-2 hover:bg-[var(--table-hover-bg)] transition-colors">
                      <div className="col-span-1 font-bold text-[var(--text-primary)] text-sm">
                        {ALGO_NAMES[algo] || algo}
                      </div>
                      
                      {sizes.map(size => {
                        const item = getCellData(algo, size);
                        const visual = getCellColor(item, size);
                        return (
                          <div key={size} className="pl-4 py-1">
                            <div 
                              style={{ 
                                backgroundColor: visual.bg, 
                                borderColor: visual.border || 'transparent' 
                              }}
                              className={`text-right rounded-lg py-3 px-3.5 font-mono text-xs border ${visual.text} transition-all duration-300 hover:scale-[1.03] select-none shadow-2xs`}
                              title={`${ALGO_NAMES[algo]} N=${size}: ${visual.label}`}
                            >
                              {visual.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-[var(--glass-border)] flex flex-wrap items-center justify-between text-xs text-[var(--text-secondary)] gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.4)]"></div>
                  <span>Optimal / Fast</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[rgba(245,158,11,0.2)] border border-[rgba(245,158,11,0.4)]"></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[rgba(244,63,94,0.2)] border border-[rgba(244,63,94,0.4)]"></div>
                  <span>Slow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[rgba(148,163,184,0.08)] border border-[var(--glass-border)]"></div>
                  <span>Skipped / O(N²) Timeout</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <HelpCircle className="w-4 h-4" />
                <span>Hover cells for raw metrics.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'line' && (
        <div className="glass-card rounded-2xl p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
          <div className="border-b border-[var(--glass-border)] pb-4 mb-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Practical Runtime Growth (Log Scale)</h3>
            <p className="text-xs text-[var(--text-secondary)] font-semibold">Compares execution time growth relative to input size dimension growth</p>
          </div>
          
          <div className="h-[400px] w-full flex items-center justify-center">
            <Line 
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    title: { display: true, text: 'Input Size (N)', font: { weight: 'bold' }, color: textColor },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                  },
                  y: {
                    type: 'logarithmic',
                    title: { display: true, text: 'Execution Time (ms) - Log Scale', font: { weight: 'bold' }, color: textColor },
                    ticks: {
                      color: textColor,
                      callback: function(value) {
                        const log10 = Math.log10(value);
                        if (Math.abs(log10 - Math.round(log10)) < 1e-9) {
                          return value + ' ms';
                        }
                        return null;
                      }
                    },
                    grid: { color: gridColor }
                  }
                },
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true, color: textColor } },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return ` ${context.dataset.label}: ${context.raw ? context.raw.toFixed(4) : 'N/A'} ms`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {viewMode === 'bar' && (
        <div className="glass-card rounded-2xl p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--glass-border)] pb-4 mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Execution Speed Benchmark Comparison</h3>
              <p className="text-xs text-[var(--text-secondary)] font-semibold">Cross-algorithm comparison at a specific input size (N)</p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Select N:</label>
              <select
                value={currentSelectedSize}
                onChange={(e) => setSelectedBarSize(Number(e.target.value))}
                className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                {sizes.map(size => (
                  <option key={size} value={size}>N = {size.toLocaleString()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <Bar 
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { 
                    grid: { display: false },
                    ticks: { color: textColor }
                  },
                  y: {
                    title: { display: true, text: 'Execution Time (ms)', font: { weight: 'bold' }, color: textColor },
                    ticks: {
                      color: textColor,
                      callback: function(value) { return value + ' ms'; }
                    },
                    grid: { color: gridColor }
                  }
                },
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
