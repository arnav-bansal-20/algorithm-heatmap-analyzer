import React, { useState, useEffect } from 'react';
import { Cpu, Brain, TrendingUp, HelpCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';

const ALGO_DISPLAY_NAMES = {
  "Student Algorithm": "★ My Algorithm (Student)",
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

const ALGO_CATEGORIES = {
  "Student Algorithm": "sorting",
  "bubble_sort": "sorting", "selection_sort": "sorting", "insertion_sort": "sorting", 
  "merge_sort": "sorting", "quick_sort": "sorting", "heap_sort": "sorting",
  "linear_search": "searching", "binary_search": "searching",
  "bfs": "graph", "dfs": "graph", "dijkstra": "graph", "topological_sort": "graph",
  "naive_pattern_matching": "string", "kmp_search": "string", "boyer_moore_search": "string",
  "knapsack": "advanced", "n_queens": "advanced"
};

export function parseMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  // Normalize newlines
  let html = markdown.replace(/\r\n/g, '\n');
  
  // Escape HTML tags to prevent XSS (since it's dangerouslySetInnerHTML)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const placeholders = [];

  // 1. Extract Code blocks: ```javascript ... ```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `PLACEHOLDERBLOCKCODE${placeholders.length}`;
    placeholders.push({
      placeholder,
      html: `<pre class="bg-slate-900/90 border border-slate-800/50 p-3 rounded-lg my-3 font-mono text-[11px] overflow-x-auto text-indigo-300"><code>${code.trim()}</code></pre>`
    });
    return placeholder;
  });

  // 2. Extract Math blocks: $ ... $ (convert LaTeX symbols to unicode/subscripts/superscripts)
  html = html.replace(/\$([^$]+)\$/g, (match, mathContent) => {
    let clean = mathContent;
    clean = clean.replace(/\\approx/g, '≈');
    clean = clean.replace(/\\times/g, '×');
    clean = clean.replace(/\\log2/g, 'log₂');
    clean = clean.replace(/\\log_2/g, 'log₂');
    clean = clean.replace(/\\log/g, 'log');
    clean = clean.replace(/\\le(q)?/g, '≤');
    clean = clean.replace(/\\ge(q)?/g, '≥');
    clean = clean.replace(/\\Theta/g, 'Θ');
    clean = clean.replace(/\\Omega/g, 'Ω');
    clean = clean.replace(/\\theta/g, 'θ');
    clean = clean.replace(/\\omega/g, 'ω');
    clean = clean.replace(/\\epsilon/g, 'ε');
    clean = clean.replace(/\\delta/g, 'δ');
    clean = clean.replace(/\\alpha/g, 'α');
    clean = clean.replace(/\\beta/g, 'β');
    clean = clean.replace(/\\cdot/g, '·');
    clean = clean.replace(/\\pm/g, '±');
    clean = clean.replace(/\\neq/g, '≠');
    clean = clean.replace(/\\infty/g, '∞');
    clean = clean.replace(/\\/g, ''); // strip any raw backslashes
    
    // Parse LaTeX superscripts: ^{...} or ^x
    clean = clean.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
    clean = clean.replace(/\^([A-Za-z0-9])/g, '<sup>$1</sup>');
    
    // Parse LaTeX subscripts: _{...} or _x
    clean = clean.replace(/_\{([^}]+)\}/g, '<sub>$1</sub>');
    clean = clean.replace(/_([A-Za-z0-9])/g, '<sub>$1</sub>');

    const placeholder = `PLACEHOLDERMATH${placeholders.length}`;
    placeholders.push({
      placeholder,
      html: `<span class="font-serif italic text-[var(--text-primary)] font-medium text-[13px] md:text-[14px]">${clean.trim()}</span>`
    });
    return placeholder;
  });

  // 3. Extract Inline code: `code`
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `PLACEHOLDERINLINECODE${placeholders.length}`;
    placeholders.push({
      placeholder,
      html: `<code class="font-mono text-[13px] text-[var(--text-primary)] font-semibold">${code}</code>`
    });
    return placeholder;
  });

  // 4. Bold key advisor labels (with or without markdown asterisks)
  const labelsRegex = /\*\*?(Use When:|Avoid When:|Best Used When:|Worst Case When:|Key Characteristics:)\*\*?/gi;
  html = html.replace(labelsRegex, '<strong class="text-[var(--text-primary)] font-bold">$1</strong>');

  // Headers: ### Header
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-[var(--text-primary)] mt-4 mb-2">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-[var(--text-primary)] mt-5 mb-2.5">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-extrabold text-[var(--text-primary)] mt-6 mb-3">$1</h2>');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italics: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Unordered list items: * item or - item
  let lines = html.split('\n');
  
  // Try to parse the first line as a title header if it's short, doesn't start with Markdown headers or numbers
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine && !firstLine.startsWith('#') && !/^\d+\./.test(firstLine) && firstLine.length < 60) {
      lines[0] = `<h3 class="text-base font-extrabold text-[var(--text-primary)] mt-2 mb-4 border-b border-[var(--glass-border)] pb-2 flex items-center gap-2">
        <span class="inline-block w-1.5 h-3.5 bg-indigo-500 rounded-xs"></span>${firstLine}
      </h3>`;
    }
  }

  let inList = false;
  let inNumList = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for numbered section headers first (e.g. "1. Performance Explanation")
    const headerMatch = line.match(/^(\d+)\.\s+([A-Za-z0-9\s:&()\-/\.',!?]{1,60})$/);
    if (headerMatch) {
      if (inList) {
        lines[i - 1] = lines[i - 1] + '</ul>';
        inList = false;
      }
      if (inNumList) {
        lines[i - 1] = lines[i - 1] + '</ol>';
        inNumList = false;
      }
      lines[i] = `<h4 class="text-[13px] font-bold text-[var(--text-primary)] mt-5 mb-2.5 flex items-center gap-1.5">
        <span class="text-indigo-500 font-extrabold font-mono">${headerMatch[1]}.</span> ${headerMatch[2]}
      </h4>`;
      continue;
    }

    if (line.startsWith('* ') || line.startsWith('- ')) {
      const content = line.substring(2);
      if (inNumList) {
        lines[i - 1] = lines[i - 1] + '</ol>';
        inNumList = false;
      }
      if (!inList) {
        lines[i] = '<ul class="list-disc pl-5 space-y-1 my-2 text-[var(--text-secondary)]">' + `<li>${content}</li>`;
        inList = true;
      } else {
        lines[i] = `<li>${content}</li>`;
      }
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      const content = match ? match[2] : line;
      if (inList) {
        lines[i - 1] = lines[i - 1] + '</ul>';
        inList = false;
      }
      if (!inNumList) {
        lines[i] = '<ol class="list-decimal pl-5 space-y-1 my-2 text-[var(--text-secondary)]">' + `<li>${content}</li>`;
        inNumList = true;
      } else {
        lines[i] = `<li>${content}</li>`;
      }
    } else {
      if (inList) {
        lines[i - 1] = lines[i - 1] + '</ul>';
        inList = false;
      }
      if (inNumList) {
        lines[i - 1] = lines[i - 1] + '</ol>';
        inNumList = false;
      }
    }
  }
  if (inList) {
    lines[lines.length - 1] = lines[lines.length - 1] + '</ul>';
  }
  if (inNumList) {
    lines[lines.length - 1] = lines[lines.length - 1] + '</ol>';
  }
  html = lines.join('\n');

  // Paragraphs
  const parts = html.split(/\n\n+/);
  const formattedParts = parts.map(part => {
    const trimmed = part.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<pre') || trimmed.startsWith('<ol') || trimmed.startsWith('<code') || trimmed.startsWith('PLACEHOLDER')) {
      return trimmed;
    }
    return `<p class="my-2 leading-relaxed text-[var(--text-secondary)]">${trimmed}</p>`;
  });
  
  html = formattedParts.join('\n');

  // Restore placeholders
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const { placeholder, html: replacement } = placeholders[i];
    html = html.replaceAll(placeholder, replacement);
  }

  return html;
}

export default function AIPrediction({ benchmarkData = [], studentAnalysis = null }) {
  const studentRuns = studentAnalysis?.benchmarks?.results || [];
  const activeBenchmarkData = [...benchmarkData, ...studentRuns];

  const [selectedAlgo, setSelectedAlgo] = useState(() => studentRuns.length > 0 ? 'Student Algorithm' : '');
  const [predictionData, setPredictionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisExplanation, setAnalysisExplanation] = useState('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisMode, setAnalysisMode] = useState('time'); // 'operations' | 'time'

  const isOps = analysisMode === 'operations' && predictionData?.operations_complexity_analysis;
  const activeAnalysis = isOps ? predictionData.operations_complexity_analysis : (predictionData?.time_complexity_analysis || null);

  // Extract unique algorithms from benchmark data
  const availableAlgos = [...new Set(activeBenchmarkData.map(d => d.algorithm))];

  useEffect(() => {
    if (availableAlgos.length > 0 && !selectedAlgo) {
      setSelectedAlgo(availableAlgos[0]);
    }
  }, [availableAlgos, selectedAlgo]);

  useEffect(() => {
    if (selectedAlgo) {
      fetchPrediction();
      setAnalysisExplanation(''); // Clear previous text
    }
  }, [selectedAlgo]);

  const fetchPrediction = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    // Filter actual runs for this algorithm
    const algoRuns = activeBenchmarkData.filter(
      d => d.algorithm === selectedAlgo && d.time_ms !== null && d.status !== 'skipped'
    );

    if (algoRuns.length < 3) {
      setPredictionData(null);
      setErrorMessage(`Need at least 3 successful data points for ${ALGO_DISPLAY_NAMES[selectedAlgo] || selectedAlgo} to perform curve-fitting analysis.`);
      setIsLoading(false);
      return;
    }

    try {
      const payload = algoRuns.map(run => ({
        size: run.size,
        time_ms: run.time_ms,
        operations: run.operations
      }));

      const res = await api.predictComplexity(selectedAlgo, payload);
      setPredictionData(res);
    } catch (err) {
      setErrorMessage("Failed to calculate regression curves: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformanceAnalysis = async () => {
    if (!predictionData || !selectedAlgo) return;
    setIsAnalysisLoading(true);
    
    const algoRuns = activeBenchmarkData.filter(d => d.algorithm === selectedAlgo && d.time_ms !== null);
    const largestRun = algoRuns.reduce((prev, current) => (prev.size > current.size) ? prev : current, algoRuns[0]);

    const payload = {
      algorithm_name: selectedAlgo,
      category: ALGO_CATEGORIES[selectedAlgo] || 'unknown',
      size: largestRun.size,
      dataset_type: largestRun.dataset_type,
      time_ms: largestRun.time_ms,
      operations: largestRun.operations,
      memory_bytes: largestRun.memory_bytes,
      recursion_depth: largestRun.recursion_depth,
      predicted_complexity: activeAnalysis?.predicted_class || 'Unknown'
    };

    try {
      const res = await api.getGeminiExplanation(payload);
      setAnalysisExplanation(res.explanation);
    } catch (err) {
      setAnalysisExplanation(`### Error Loading Analysis\n\nFailed to contact API: ${err.message}`);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  if (activeBenchmarkData.length === 0) {
    return (
      <div className="page-transition glass-card rounded-2xl p-12 text-center text-[var(--text-secondary)] space-y-4">
        <AlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto animate-bounce" />
        <h3 className="text-xl font-bold text-[var(--text-primary)]">No Benchmark Data Found</h3>
        <p className="max-w-md mx-auto text-sm text-[var(--text-secondary)]">
          Run benchmarks first on the <b>Analyze My Algorithm</b> page. Regression models and curve analysis require active telemetry data.
        </p>
      </div>
    );
  }

  // Generate curve-fitting dataset for charting
  const renderChart = () => {
    if (!predictionData) return null;
    
    const algoRuns = activeBenchmarkData.filter(
      d => d.algorithm === selectedAlgo && d.time_ms !== null && d.status !== 'skipped'
    ).sort((a, b) => a.size - b.size);
    
    const sizes = algoRuns.map(r => r.size);
    
    const isOps = analysisMode === 'operations' && predictionData.operations_complexity_analysis;
    const activeAnalysis = isOps ? predictionData.operations_complexity_analysis : predictionData.time_complexity_analysis;
    
    const actualValues = isOps ? algoRuns.map(r => r.operations) : algoRuns.map(r => r.time_ms);
    
    const predictedClass = activeAnalysis.predicted_class;
    const coef = activeAnalysis.coef;
    const intercept = activeAnalysis.intercept;
    
    const evaluateModel = (n, complexityClass, m, c) => {
      if (n <= 0) return 0;
      let x = 0;
      if (complexityClass === "O(log n)") x = Math.log2(n);
      else if (complexityClass === "O(n)") x = n;
      else if (complexityClass === "O(n log n)") x = n * Math.log2(n);
      else if (complexityClass === "O(n²)") x = n * n;
      return Math.max(0, m * x + c);
    };

    const fittedValues = sizes.map(size => evaluateModel(size, predictedClass, coef, intercept));

    const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
    const textColor = isLight ? '#475569' : '#94a3b8';
    const gridColor = isLight ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.06)';

    const chartData = {
      labels: sizes.map(s => s.toLocaleString()),
      datasets: [
        {
          label: isOps ? 'Actual Telemetry Operations' : 'Actual Telemetry Time (ms)',
          data: actualValues,
          borderColor: '#f43f5e',
          backgroundColor: '#f43f5e',
          borderWidth: 0,
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false, // Scatter effect
          order: 1
        },
        {
          label: `Fitted Complexity Curve: ${predictedClass}`,
          data: fittedValues,
          borderColor: '#06b6d4',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.15,
          order: 2
        }
      ]
    };

    return (
      <div className="h-[300px] w-full mt-4">
        <Line 
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { 
                grid: { color: gridColor }, 
                title: { display: true, text: 'Input Size (N)', color: textColor },
                ticks: { color: textColor }
              },
              y: { 
                grid: { color: gridColor },
                title: { display: true, text: isOps ? 'Operation Count' : 'Execution Time (ms)', color: textColor },
                ticks: { color: textColor }
              }
            },
            plugins: {
              legend: { 
                position: 'top',
                labels: { color: textColor }
              }
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className="page-transition space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Complexity Prediction</h1>
          <p className="text-[var(--text-secondary)] text-sm font-semibold">Regression curve-fitting analysis and extrapolation modeling</p>
        </div>

        {/* Algorithm selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Selected Algorithm:</label>
          <select
            value={selectedAlgo}
            onChange={(e) => setSelectedAlgo(e.target.value)}
            className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer shadow-xs"
          >
            {availableAlgos.map(algo => (
              <option key={algo} value={algo} className="bg-slate-900 text-slate-100">{ALGO_DISPLAY_NAMES[algo] || algo}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-[var(--text-secondary)]">
          <RefreshCw className="w-8 h-8 text-[var(--sidebar-active-text)] animate-spin" />
          <span>Fitting regression functions...</span>
        </div>
      ) : errorMessage ? (
        <div className="glass-card rounded-2xl p-8 border-[var(--neon-rose)]/40 flex items-start gap-4 text-[var(--text-primary)] bg-[rgba(244,63,94,0.06)]">
          <AlertCircle className="w-6 h-6 text-[var(--neon-rose)] shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-[var(--neon-rose)]">Analysis Halted</h4>
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      ) : predictionData ? (
        <div className="space-y-6">
          {/* Analysis Mode Toggle Tabs */}
          <div className="flex bg-slate-800/20 border border-slate-700/20 p-1 rounded-xl shadow-xs w-fit">
            <button
              onClick={() => setAnalysisMode('operations')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                analysisMode === 'operations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Theoretical Complexity (Operations)
            </button>
            <button
              onClick={() => setAnalysisMode('time')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                analysisMode === 'time' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Practical Complexity (Runtime)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Regression Chart & Math Fit */}
            <div className="lg:col-span-2 space-y-6">
              {/* Chart Card */}
              <div className="glass-card rounded-2xl p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3">
                  Least Squares Regression Curve Fit
                </h3>
                {renderChart()}
              </div>

              {/* Regression breakdown */}
              <div className="glass-card rounded-2xl p-6 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3 mb-4">
                  Complexity Class Fitting Scores (R² Analysis)
                </h3>
                
                <div className="space-y-3">
                  {activeAnalysis && Object.entries(activeAnalysis.fits).map(([fitName, fitVal]) => {
                    const isBest = fitName === activeAnalysis.predicted_class;
                    return (
                      <div 
                        key={fitName} 
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isBest 
                            ? 'bg-[var(--sidebar-active-bg)] border-[var(--sidebar-active-text)] text-[var(--sidebar-active-text)] font-semibold shadow-xs' 
                            : 'bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <span className="text-sm font-bold font-mono">{fitName}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden hidden md:block">
                            <div 
                              className={`h-full rounded-full ${isBest ? 'bg-[var(--neon-cyan)]' : 'bg-slate-600'}`}
                              style={{ width: `${fitVal.r2 * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono">R² = {fitVal.r2.toFixed(4)}</span>
                          {isBest && (
                            <span className="text-[10px] bg-[var(--sidebar-active-text)] text-slate-900 px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">
                              Best Fit
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Metrics Sidebar & Analysis Advisor */}
            <div className="lg:col-span-1 space-y-6">
              {/* O(n) Prediction metrics */}
              <div className="glass-card rounded-2xl p-6 space-y-4 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[var(--neon-cyan)]" /> Regressor Insights
                </h3>

                <div className="space-y-4">
                  <div className="bg-[var(--card-hover-bg)] border border-[var(--glass-border)] p-4 rounded-xl space-y-1">
                    <span className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">Growth Class</span>
                    <div className="text-2xl font-extrabold text-[var(--text-primary)] font-mono">
                      {activeAnalysis?.predicted_class || 'Unknown'}
                    </div>
                    <span className="text-[11px] text-[var(--text-secondary)] block">
                      Confidence: <b>{((activeAnalysis?.confidence || 0) * 100).toFixed(2)}%</b>
                    </span>
                  </div>

                  {/* Future Extrapolations */}
                  <div className="space-y-2">
                    <span className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider block">Performance Extrapolations</span>
                    <div className="border border-[var(--glass-border)] rounded-xl divide-y divide-[var(--glass-border)] overflow-hidden bg-[var(--glass-bg)]">
                      {Object.entries(predictionData.extrapolations).map(([size, value]) => (
                        <div key={size} className="flex justify-between p-3 text-xs font-mono">
                          <span className="text-[var(--text-secondary)]">N = {Number(size).toLocaleString()}</span>
                          <span className="font-bold text-[var(--text-primary)]">{value.toLocaleString()} ms</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      Extrapolated execution times are computed using the fitted regression formula: <i>T(N) = m · f(N) + c</i>.
                    </p>
                  </div>
                </div>
              </div>

            {/* Performance Explainer */}
            <div className="glass-card rounded-2xl p-6 space-y-4 bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-[var(--neon-violet)] animate-pulse" /> Performance Advisor
              </h3>
              
              {analysisExplanation ? (
                <div className="space-y-4">
                  <div className="prose prose-sm text-[var(--text-secondary)] border-l-2 border-[var(--sidebar-active-text)] pl-3.5 leading-relaxed text-[13px] md:text-sm overflow-y-auto max-h-[420px] pr-2 scrollbar-thin">
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(analysisExplanation) }} />
                  </div>
                  <button
                    onClick={() => setAnalysisExplanation('')}
                    className="w-full text-center text-xs font-bold text-[var(--sidebar-active-text)] hover:opacity-85 cursor-pointer"
                  >
                    Clear Analysis
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Generate an advanced educational explanation of this algorithm's physical behaviors.
                  </p>
                  <button
                    onClick={getPerformanceAnalysis}
                    disabled={isAnalysisLoading}
                    className="w-full flex items-center justify-center gap-2 btn-neon rounded-xl py-2.5 font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isAnalysisLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing result...
                      </>
                    ) : (
                      <>
                        <Brain className="w-3.5 h-3.5" /> Generate Performance Analysis
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      ) : null}
    </div>
  );
}
