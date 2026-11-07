import React, { useState, useEffect } from 'react';
import {
  Home, Code, BarChart3, Grid, TrendingUp, Sparkles,
  LayoutGrid, MessageSquare, Menu, X, Cpu, Sun, Moon
} from 'lucide-react';

// Import Pages
import HomePage from './pages/Home';
import StudentAnalyzerPage from './pages/StudentAnalyzer';
import AlgorithmComparisonPage from './pages/AlgorithmComparison';
import HeatmapAnalysisPage from './pages/HeatmapAnalysis';
import AIPredictionPage from './pages/AIPrediction';
import CodeOptimizationPage from './pages/CodeOptimization';
import VisualizerPage from './pages/Visualizer';
import AIChatPage from './pages/AIChat';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [currentStudentAnalysis, setCurrentStudentAnalysis] = useState(null);

  const [benchmarkData, setBenchmarkData] = useState(() => {
    try {
      const saved = localStorage.getItem('benchmark_runs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('benchmark_runs', JSON.stringify(benchmarkData));
  }, [benchmarkData]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // 8 Main Navigation Items specified in requirements
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'analyze', label: 'Analyze My Algorithm', icon: Code, highlight: true },
    { id: 'comparison', label: 'Compare Algorithms', icon: BarChart3 },
    { id: 'heatmap', label: 'Performance Heatmap', icon: Grid },
    { id: 'complexity', label: 'Complexity Analysis', icon: TrendingUp },
    { id: 'optimization', label: 'Code Optimization', icon: Sparkles },
    { id: 'visualizer', label: 'Algorithm Visualizer', icon: LayoutGrid },
    { id: 'aichat', label: 'AI Study Companion', icon: MessageSquare }
  ];

  const handleNavigate = (pageId) => {
    setPage(pageId);
    setMobileMenuOpen(false);
  };

  const handleNavigateWithAnalysis = (targetPage, analysisData) => {
    setCurrentStudentAnalysis(analysisData);
    setPage(targetPage);
  };

  const renderActivePage = () => {
    switch (page) {
      case 'dashboard':
        return <HomePage setPage={setPage} />;
      case 'analyze':
        return (
          <StudentAnalyzerPage
            onNavigateToComparison={(data) => handleNavigateWithAnalysis('comparison', data)}
            onNavigateToOptimization={(data) => handleNavigateWithAnalysis('optimization', data)}
          />
        );
      case 'comparison':
        return <AlgorithmComparisonPage benchmarkData={benchmarkData} studentAnalysis={currentStudentAnalysis} />;
      case 'heatmap':
        return <HeatmapAnalysisPage benchmarkData={benchmarkData} studentAnalysis={currentStudentAnalysis} />;
      case 'complexity':
        return <AIPredictionPage benchmarkData={benchmarkData} studentAnalysis={currentStudentAnalysis} />;
      case 'optimization':
        return <CodeOptimizationPage initialAnalysis={currentStudentAnalysis} />;
      case 'visualizer':
        return <VisualizerPage />;
      case 'aichat':
        return <AIChatPage benchmarkData={benchmarkData} customCode={currentStudentAnalysis?.student_code} />;
      default:
        return <HomePage setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] relative transition-colors duration-300">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full glass-header border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
          
          {/* Brand / Logo */}
          <div 
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 group-hover:border-indigo-500/60 transition-all duration-200 shadow-sm shadow-indigo-500/10">
              <Cpu className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)] leading-none group-hover:text-indigo-300 transition-colors">
                Algorithm Analyzer
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium tracking-wide mt-1">
                Student Edition 2.0
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto scrollbar-none py-1">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`
                    flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-xs border border-[var(--glass-border)]' 
                      : item.highlight
                        ? 'text-indigo-400 hover:bg-indigo-500/10 font-bold border border-indigo-500/20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)]'}
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[var(--sidebar-active-text)]' : item.highlight ? 'text-indigo-400' : 'text-[var(--text-secondary)]'}`} />
                  <span>{item.label}</span>
                  {item.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sandbox Online Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-semibold whitespace-nowrap">Sandbox Online</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition cursor-pointer"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:text-indigo-400 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 py-4 border-t border-[var(--glass-border)] bg-[var(--bg-app)]/95 backdrop-blur-2xl space-y-3 animate-fadeIn">
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer
                      ${isActive 
                        ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] border border-[var(--glass-border)]' 
                        : item.highlight
                          ? 'text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 font-bold border border-indigo-500/20'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)]'}
                    `}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--sidebar-active-text)]' : item.highlight ? 'text-indigo-400' : 'text-[var(--text-secondary)]'}`} />
                    <span className="truncate">{item.label}</span>
                    {item.highlight && !isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[var(--text-secondary)]">Student Edition 2.0</span>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sandbox Online</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto">
        {renderActivePage()}
      </main>
    </div>
  );
}
