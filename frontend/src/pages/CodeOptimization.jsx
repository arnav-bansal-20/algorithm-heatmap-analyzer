import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Play,
  RefreshCw, TrendingUp, Copy, Check, Code, ShieldCheck
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { api } from '../services/api';

export default function CodeOptimization({ initialAnalysis }) {
  const [originalCode, setOriginalCode] = useState(() => initialAnalysis?.student_code || initialAnalysis?.code || `def bubble_sort(arr):
    n = len(arr)
    arr = list(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
`);
  const [language, setLanguage] = useState(() => initialAnalysis?.language || 'python');
  const [category, setCategory] = useState(() => initialAnalysis?.category || 'sorting');

  const [optimizationData, setOptimizationData] = useState(() => initialAnalysis?.optimizations || null);
  const [isLoading, setIsLoading] = useState(false);
  const [compareRunning, setCompareRunning] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [copied, setCopied] = useState(false);

  // Trigger optimization analysis
  const handleAnalyzeOptimizations = async () => {
    setIsLoading(true);
    setComparisonResults(null);
    try {
      const res = await api.optimizeStudentCode(language, originalCode, category);
      setOptimizationData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run side-by-side benchmark comparison between original and optimized
  const handleComparePerformance = async () => {
    if (!optimizationData?.optimized_code) return;
    setCompareRunning(true);
    try {
      // Benchmark original
      const origBench = await api.compareStudentAlgorithm(language, originalCode, category, [], 'random', [100, 1000]);
      // Benchmark optimized
      const optBench = await api.compareStudentAlgorithm(language, optimizationData.optimized_code, category, [], 'random', [100, 1000]);

      setComparisonResults({
        original: origBench.results || [],
        optimized: optBench.results || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCompareRunning(false);
    }
  };

  const handleCopyOptimized = () => {
    if (optimizationData?.optimized_code) {
      navigator.clipboard.writeText(optimizationData.optimized_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Interactive Optimizer
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">Asymptotic Delta & Refactoring</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--text-primary)]">
            Algorithm Optimization & Bottleneck Review
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl mt-1">
            Detect algorithmic bottlenecks, redundant iterations, and missing termination conditions. Compare original and optimized code side-by-side.
          </p>
        </div>

        <button
          onClick={handleAnalyzeOptimizations}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow-lg hover:shadow-indigo-500/25"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{isLoading ? 'Scanning Bottlenecks...' : 'Scan Code for Optimizations'}</span>
        </button>
      </div>

      {/* Main Diff Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-slate-400" />
              Original Submission
            </h3>
            <span className="text-[11px] text-slate-400">Current Code Under Review</span>
          </div>

          <CodeEditor
            code={originalCode}
            setCode={setOriginalCode}
            language={language}
            setLanguage={setLanguage}
            category={category}
          />
        </div>

        {/* Suggested Optimized Code */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Suggested Optimized Version
            </h3>
            {optimizationData?.optimized_code && (
              <button
                onClick={handleCopyOptimized}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Optimized'}</span>
              </button>
            )}
          </div>

          {optimizationData?.optimized_code ? (
            <CodeEditor
              code={optimizationData.optimized_code}
              setCode={() => {}}
              language={language}
              category={category}
              readOnly={true}
            />
          ) : (
            <div className="h-[400px] rounded-2xl glass-card border border-dashed border-slate-800 p-8 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              <div className="text-xs text-slate-400 max-w-xs">
                Click <strong>Scan Code for Optimizations</strong> to detect algorithmic improvements and generate refactored code.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Identified Issues & Recommendations */}
      {optimizationData?.optimizations?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Identified Inefficiencies ({optimizationData.optimizations.length})
            </h2>
            <div className="text-xs font-bold text-indigo-400 font-mono">
              Expected Improvement: {optimizationData.theoretical_improvement}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optimizationData.optimizations.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl glass-card border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    {item.issue}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.location}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.explanation}
                </p>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-emerald-400">Recommended Action:</div>
                  <div className="text-slate-300">{item.suggested_fix}</div>
                  <div className="text-[11px] text-cyan-400 font-mono mt-1">
                    Delta: {item.theoretical_delta}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Benchmark Verification Button */}
          {optimizationData.optimized_code && (
            <div className="p-5 rounded-2xl glass-card border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">
                  Verify Performance Improvement Live
                </h4>
                <p className="text-xs text-slate-400">
                  Run synchronized sandbox benchmarks comparing original code against the optimized version.
                </p>
              </div>

              <button
                onClick={handleComparePerformance}
                disabled={compareRunning}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-lg"
              >
                {compareRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{compareRunning ? 'Benchmarking Both Versions...' : 'Run Benchmark Diff'}</span>
              </button>
            </div>
          )}

          {/* Performance Comparison Diff Table */}
          {comparisonResults && (
            <div className="p-5 rounded-2xl glass-card space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Benchmark Comparison
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                      <th className="py-2">Input Size</th>
                      <th className="py-2">Original Time</th>
                      <th className="py-2">Optimized Time</th>
                      <th className="py-2">Speedup Factor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {comparisonResults.original.map((orig, idx) => {
                      const opt = comparisonResults.optimized[idx];
                      const origTime = orig?.time_ms || 0;
                      const optTime = opt?.time_ms || 0;
                      const speedup = optTime > 0 ? (origTime / optTime).toFixed(1) : 'N/A';
                      return (
                        <tr key={idx}>
                          <td className="py-2.5 font-bold">N = {orig.size}</td>
                          <td className="py-2.5 text-rose-300">{origTime} ms</td>
                          <td className="py-2.5 text-emerald-300 font-bold">{optTime} ms</td>
                          <td className="py-2.5 text-cyan-400 font-bold">{speedup}x faster</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

