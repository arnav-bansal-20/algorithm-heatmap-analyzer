import React, { useState, useEffect } from 'react';
import {
  Code, Play, CheckCircle2, XCircle, AlertTriangle, Cpu, TrendingUp,
  Award, Sparkles, Download, RefreshCw, BarChart2, ShieldCheck,
  ChevronRight, ExternalLink, HelpCircle, History, ArrowRight
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import CodeEditor, { STARTER_TEMPLATES } from '../components/CodeEditor';
import { parseMarkdownToHtml } from './AIPrediction';

const PROBLEM_CATEGORIES = [
  { id: 'sorting', name: 'Sorting', icon: BarChart2, desc: 'Array element ordering' },
  { id: 'searching', name: 'Searching', icon: HelpCircle, desc: 'Linear & binary key lookups' },
  { id: 'graph', name: 'Graph Algorithms', icon: Cpu, desc: 'Traversal, shortest paths & topological order' },
  { id: 'string', name: 'String Matching', icon: Code, desc: 'Pattern matching & substrings' },
  { id: 'advanced', name: 'Dynamic Programming & Backtracking', icon: Sparkles, desc: 'Knapsack & N-Queens' }
];

export default function StudentAnalyzer({ onNavigateToComparison, onNavigateToOptimization }) {
  // Submission Form State
  const [algoName, setAlgoName] = useState('My Custom Algorithm');
  const [description, setDescription] = useState('An implementation designed to analyze algorithmic complexity and trade-offs.');
  const [category, setCategory] = useState('sorting');
  const [language, setLanguage] = useState('python');
  const [datasetType, setDatasetType] = useState('random');
  const [code, setCode] = useState(() => STARTER_TEMPLATES.sorting.python);

  // Compatible Standard Algorithms
  const [catalog, setCatalog] = useState({});
  const [selectedStandardAlgos, setSelectedStandardAlgos] = useState(['insertion_sort', 'quick_sort']);

  // Analysis Execution & Results
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // 'validating' | 'benchmarking' | 'analyzing' | 'done'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'correctness' | 'performance' | 'complexity' | 'quality' | 'ai'

  // History Drawer
  const [historyList, setHistoryList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch algorithm catalog and history on mount
  useEffect(() => {
    api.getSupportedAlgorithms()
      .then(data => {
        setCatalog(data);
        if (data[category]) {
          const available = data[category].algorithms.map(a => a.id);
          setSelectedStandardAlgos(available.slice(0, 2));
        }
      })
      .catch(console.error);

    loadHistory();
  }, []);

  // Update default code & comparison algorithms when category changes
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const catTemplates = STARTER_TEMPLATES[newCat] || STARTER_TEMPLATES.sorting;
    const newCode = catTemplates[language] || catTemplates.python || STARTER_TEMPLATES.sorting.python;
    setCode(newCode);

    if (catalog[newCat]) {
      const available = catalog[newCat].algorithms.map(a => a.id);
      setSelectedStandardAlgos(available.slice(0, Math.min(3, available.length)));
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const catTemplates = STARTER_TEMPLATES[category] || STARTER_TEMPLATES.sorting;
    if (catTemplates[newLang]) {
      setCode(catTemplates[newLang]);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getStudentHistory(10);
      setHistoryList(res.analyses || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnalysisFromHistory = async (aid) => {
    try {
      setIsRunning(true);
      const data = await api.getStudentAnalysis(aid);
      setAlgoName(data.algorithm_name);
      setCategory(data.category);
      setLanguage(data.language);
      setCode(data.student_code);
      setAnalysisResult({
        analysis_id: data.id,
        algorithm_name: data.algorithm_name,
        language: data.language,
        category: data.category,
        correctness: data.correctness_results,
        benchmarks: data.benchmark_results,
        complexity: data.complexity_results,
        quality: data.quality_results,
        optimizations: data.optimization_results,
        ai_report: data.ai_feedback
      });
      setShowHistory(false);
    } catch (e) {
      setErrorMsg('Failed to load analysis record.');
    } finally {
      setIsRunning(false);
    }
  };

  // Run Complete Lifecycle Analysis
  const handleRunAnalysis = async () => {
    if (!code.trim()) {
      setErrorMsg('Please enter algorithm source code before submitting.');
      return;
    }

    setIsRunning(true);
    setErrorMsg(null);
    setCurrentStep('validating');

    try {
      // Step 1: Validate correctness first
      const valRes = await api.validateStudentAlgorithm(language, code, category);

      setCurrentStep('benchmarking');
      // Step 2: Run Full Lifecycle
      const fullRes = await api.runFullStudentAnalysis({
        algorithm_name: algoName,
        language,
        category,
        code,
        standard_algorithms: selectedStandardAlgos,
        dataset_type: datasetType,
        sizes: [10, 100, 1000]
      });

      setAnalysisResult(fullRes);
      setCurrentStep('done');
      loadHistory();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Analysis encountered a server error. Check sandbox execution logs.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysisResult?.analysis_id) return;
    window.open(`/api/student/report/${analysisResult.analysis_id}`, '_blank');
  };

  const toggleStandardAlgo = (algoId) => {
    if (selectedStandardAlgos.includes(algoId)) {
      if (selectedStandardAlgos.length > 1) {
        setSelectedStandardAlgos(selectedStandardAlgos.filter(id => id !== algoId));
      }
    } else {
      setSelectedStandardAlgos([...selectedStandardAlgos, algoId]);
    }
  };

  // Prepare chart data for execution time
  const renderComparisonChart = () => {
    if (!analysisResult?.benchmarks?.results) return null;
    const runs = analysisResult.benchmarks.results;
    const sizes = [...new Set(runs.map(r => r.size))].sort((a, b) => a - b);
    const algos = [...new Set(runs.map(r => r.algorithm))];

    const colors = [
      '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'
    ];

    const datasets = algos.map((algo, idx) => {
      const algoRuns = runs.filter(r => r.algorithm === algo);
      const dataPoints = sizes.map(s => {
        const item = algoRuns.find(r => r.size === s);
        return item ? item.time_ms : null;
      });

      const isStudent = algo === 'Student Algorithm';
      return {
        label: isStudent ? `★ ${algoName} (You)` : algo.replace(/_/g, ' ').toUpperCase(),
        data: dataPoints,
        borderColor: isStudent ? '#38bdf8' : colors[idx % colors.length],
        backgroundColor: isStudent ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
        borderWidth: isStudent ? 3 : 2,
        borderDash: isStudent ? [] : [4, 4],
        tension: 0.2,
        pointRadius: isStudent ? 5 : 3
      };
    });

    return {
      labels: sizes.map(s => `N=${s}`),
      datasets
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Primary Academic Feature
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">Multi-Language Sandbox</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-[var(--text-primary)]">
            Student Algorithm Analyzer
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl mt-1">
            Submit your source code in Python, C, C++, Java, or JavaScript. Validate correctness against test oracles, benchmark with standard algorithms, and receive theoretical/empirical complexity evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold glass-card border border-[var(--glass-border)] text-[var(--text-primary)] hover:border-indigo-500/40 transition cursor-pointer"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>Analysis History ({historyList.length})</span>
          </button>

          {analysisResult && (
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* History Slide-out Drawer */}
      {showHistory && (
        <div className="p-4 rounded-2xl glass-card border border-indigo-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Previous Submissions
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-[var(--text-secondary)] hover:text-slate-100"
            >
              Close
            </button>
          </div>
          {historyList.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">No past submissions found in SQLite database.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {historyList.map(h => (
                <div
                  key={h.id}
                  onClick={() => loadAnalysisFromHistory(h.id)}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition text-left"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 truncate">{h.algorithm_name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${h.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {h.is_correct ? '100%' : 'Mismatch'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{h.language.toUpperCase()} • {h.category}</span>
                    <span className="text-indigo-400 font-mono">{h.predicted_class}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Input Column & Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metadata & Code Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Metadata Card */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Code className="w-4 h-4" />
              1. Algorithm Specification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Algorithm Name
                </label>
                <input
                  type="text"
                  value={algoName}
                  onChange={(e) => setAlgoName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., QuickSort with Median-of-Three"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Problem Category
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {PROBLEM_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Description & Implementation Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="Brief description of data structures, pivot strategies, or state space..."
              />
            </div>
          </div>

          {/* Code Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Code className="w-4 h-4" />
                2. Source Code
              </h2>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span>Dataset:</span>
                <select
                  value={datasetType}
                  onChange={(e) => setDatasetType(e.target.value)}
                  className="bg-slate-900 text-slate-300 text-xs rounded-lg px-2 py-0.5 border border-slate-700 cursor-pointer"
                >
                  <option value="random">Random Distribution</option>
                  <option value="sorted">Already Sorted</option>
                  <option value="reverse_sorted">Reverse Sorted</option>
                  <option value="nearly_sorted">Nearly Sorted</option>
                  <option value="duplicate_heavy">Duplicate Heavy</option>
                  <option value="edge_cases">Edge Cases</option>
                </select>
              </div>
            </div>

            <CodeEditor
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={handleLanguageChange}
              category={category}
            />
          </div>

          {/* Standard Algorithms Selection */}
          <div className="p-5 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                3. Compare Against Standard Algorithms
              </h2>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Select 1 to 4 algorithms
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {catalog[category]?.algorithms?.map(algo => {
                const isSelected = selectedStandardAlgos.includes(algo.id);
                return (
                  <button
                    key={algo.id}
                    onClick={() => toggleStandardAlgo(algo.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">{algo.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex gap-1.5">
                      <span>Worst: <strong className="text-slate-300">{algo.worst}</strong></span>
                      <span>Space: <strong className="text-slate-300">{algo.space}</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit & Analyze Action Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={isRunning}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              isRunning
                ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/25 hover:scale-[1.01]'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                <span>
                  {currentStep === 'validating' && 'Verifying Correctness Against Oracles...'}
                  {currentStep === 'benchmarking' && 'Executing Sandboxed Benchmark Runs...'}
                  {currentStep === 'analyzing' && 'Generating AI Report & Complexity Models...'}
                  {!currentStep && 'Running Analysis...'}
                </span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Submit and Analyze Algorithm</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live Analysis & Detailed Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {!analysisResult ? (
            <div className="h-full min-h-[460px] rounded-2xl glass-card border border-dashed border-slate-800 p-8 flex flex-col items-center justify-center text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-200">Awaiting Submission</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click <strong>Submit and Analyze Algorithm</strong> to execute test suites, benchmark performance, and fit empirical complexity curves.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
                Sandboxed Docker/Process Isolation • Zero Network Access • Memory Limits
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Executive Metrics Overview Header */}
              <div className="p-5 rounded-2xl glass-card border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 className="text-sm font-extrabold text-slate-200">
                      Analysis Complete
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {analysisResult.analysis_id?.slice(0, 14)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Correctness</div>
                    <div className={`text-base font-extrabold mt-0.5 ${analysisResult.correctness?.is_correct ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {analysisResult.correctness?.correctness_percentage}%
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {analysisResult.correctness?.passed_tests}/{analysisResult.correctness?.total_tests} passed
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Worst Case</div>
                    <div className="text-base font-extrabold text-indigo-300 mt-0.5 font-mono">
                      {analysisResult.complexity?.theoretical?.worst_case || 'O(n²)'}
                    </div>
                    <div className="text-[10px] text-slate-500">Theoretical AST</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Quality Score</div>
                    <div className="text-base font-extrabold text-cyan-400 mt-0.5 font-mono">
                      {analysisResult.quality?.overall_score || 85}/100
                    </div>
                    <div className="text-[10px] text-slate-500">{analysisResult.quality?.rating || 'Good'}</div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 overflow-x-auto text-xs">
                {[
                  { id: 'overview', label: 'Summary' },
                  { id: 'correctness', label: `Correctness (${analysisResult.correctness?.passed_tests}/${analysisResult.correctness?.total_tests})` },
                  { id: 'performance', label: 'Benchmarks' },
                  { id: 'complexity', label: 'Complexity' },
                  { id: 'quality', label: 'Quality' },
                  { id: 'ai', label: 'AI Review' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Correctness Alert */}
                  <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                    analysisResult.correctness?.is_correct
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    {analysisResult.correctness?.is_correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold">
                        {analysisResult.correctness?.is_correct ? 'Correctness Verified' : 'Diagnostic Mode (Discrepancies Found)'}
                      </div>
                      <div className="text-slate-300">
                        {analysisResult.correctness?.is_correct
                          ? 'Your algorithm produced 100% correct outputs matching oracle references on all boundary, empty, duplicate, and stress test suites.'
                          : 'Your algorithm failed some test cases. Performance data is provided for diagnostic inspection only.'}
                      </div>
                    </div>
                  </div>

                  {/* Benchmark Mini Line Chart */}
                  <div className="p-4 rounded-2xl glass-card space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Execution Time vs Standard Algorithms
                    </h4>
                    <div className="h-48 w-full">
                      <Line
                        data={renderComparisonChart()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: { boxWidth: 10, font: { size: 10 }, color: '#94a3b8' }
                            }
                          },
                          scales: {
                            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Action Navigation Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onNavigateToComparison && onNavigateToComparison(analysisResult)}
                      className="p-3 rounded-xl glass-card border border-indigo-500/20 hover:border-indigo-500/40 text-left transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200">Full Comparison</div>
                        <div className="text-[10px] text-slate-400">Heatmaps & operations</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-indigo-400" />
                    </button>

                    <button
                      onClick={() => onNavigateToOptimization && onNavigateToOptimization(analysisResult)}
                      className="p-3 rounded-xl glass-card border border-indigo-500/20 hover:border-indigo-500/40 text-left transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200">Code Optimization</div>
                        <div className="text-[10px] text-slate-400">Bottlenecks & fixes</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-indigo-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CORRECTNESS DETAILS */}
              {activeTab === 'correctness' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Results across {analysisResult.correctness?.total_tests} independent test cases:
                  </div>
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {analysisResult.correctness?.test_cases?.map((tc, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          tc.passed ? 'bg-slate-900/60 border-slate-800' : 'bg-rose-950/20 border-rose-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-200">{tc.test_id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            tc.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {tc.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex justify-between">
                          <span>Runtime: {tc.execution_time_ms} ms</span>
                          {tc.error && <span className="text-rose-400 font-mono text-[10px]">{tc.error}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PERFORMANCE */}
              {activeTab === 'performance' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl glass-card space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Benchmark Measurements Table
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                            <th className="py-2">Algorithm</th>
                            <th className="py-2">Size</th>
                            <th className="py-2">Time (ms)</th>
                            <th className="py-2">Memory</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {analysisResult.benchmarks?.results?.map((r, i) => (
                            <tr key={i} className={r.algorithm === 'Student Algorithm' ? 'bg-indigo-500/10 font-bold' : ''}>
                              <td className="py-2">{r.algorithm === 'Student Algorithm' ? '★ Student Code' : r.algorithm}</td>
                              <td className="py-2">{r.size}</td>
                              <td className="py-2">{r.time_ms !== null ? `${r.time_ms} ms` : 'Skipped'}</td>
                              <td className="py-2">{r.memory_bytes ? `${Math.round(r.memory_bytes / 1024)} KB` : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: COMPLEXITY */}
              {activeTab === 'complexity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl glass-card space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Theoretical Model</div>
                      <div className="text-lg font-mono font-bold text-indigo-400">
                        {analysisResult.complexity?.theoretical?.worst_case}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Best: {analysisResult.complexity?.theoretical?.best_case} • Space: {analysisResult.complexity?.theoretical?.space_complexity}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl glass-card space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Empirical Regression</div>
                      <div className="text-lg font-mono font-bold text-cyan-400">
                        {analysisResult.complexity?.empirical?.predicted_class}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        R² = {analysisResult.complexity?.empirical?.r2_score} (Confidence)
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                    <div className="font-bold text-slate-200">Asymptotic Extrapolations:</div>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                      {Object.entries(analysisResult.complexity?.empirical?.extrapolations || {}).map(([n, t]) => (
                        <div key={n} className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                          <div className="text-[9px] text-slate-500">N={parseInt(n).toLocaleString()}</div>
                          <div className="text-indigo-300 font-bold mt-0.5">{t} ms</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-500 italic mt-2">
                      {analysisResult.complexity?.empirical?.disclaimer}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: QUALITY */}
              {activeTab === 'quality' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl glass-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Overall Rubric Score</span>
                      <span className="text-sm font-extrabold text-cyan-400">{analysisResult.quality?.overall_score}/100</span>
                    </div>

                    {Object.entries(analysisResult.quality?.dimensions || {}).map(([dim, val]) => (
                      <div key={dim} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span className="capitalize">{dim.replace('_', ' ')}</span>
                          <span className="font-mono text-slate-300">{val}/20</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(val / 20) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {analysisResult.quality?.findings?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quality Findings</h4>
                      {analysisResult.quality.findings.map((f, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                          <div className="font-semibold text-amber-300 flex items-center justify-between">
                            <span>{f.title}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">-{f.penalty} pts</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{f.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: AI REPORT */}
              {activeTab === 'ai' && (
                <div className="p-5 rounded-2xl glass-card max-h-[500px] overflow-y-auto space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-indigo-400">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Gemini AI Professor Comprehensive Evaluation</span>
                  </div>
                  <div
                    className="prose prose-invert prose-xs text-slate-300 leading-relaxed text-xs space-y-3"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(analysisResult.ai_report) }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

