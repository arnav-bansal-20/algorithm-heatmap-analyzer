import React, { useState, useEffect } from 'react';
import { Home, Play, Grid, TrendingUp, BarChart3, Info, Database, Menu, X, Cpu, Sun, Moon, LayoutGrid, Sparkles } from 'lucide-react';

// Import Pages
import HomePage from './pages/Home';
import BenchmarkingPage from './pages/Benchmarking';
import HeatmapAnalysisPage from './pages/HeatmapAnalysis';
import AIPredictionPage from './pages/AIPrediction';
import AlgorithmComparisonPage from './pages/AlgorithmComparison';
import AboutProjectPage from './pages/AboutProject';
import VisualizerPage from './pages/Visualizer';
import AIChatPage from './pages/AIChat';

export default function App() {
  const [page, setPage] = useState('home');
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

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'benchmark', label: 'Benchmarking', icon: Play },
    { id: 'visualizer', label: 'Visualizer', icon: LayoutGrid },
    { id: 'aichat', label: 'AI Study Companion', icon: Sparkles },
    { id: 'heatmap', label: 'Heatmap Analysis', icon: Grid },
    { id: 'prediction', label: 'Complexity Prediction', icon: TrendingUp },
    { id: 'comparison', label: 'Algorithm Comparison', icon: BarChart3 },
    { id: 'about', label: 'About Project', icon: Info }
  ];

  const handleNavigate = (pageId) => {
    setPage(pageId);
    setMobileMenuOpen(false);
  };

  const renderActivePage = () => {
    switch (page) {
      case 'home':
        return <HomePage setPage={setPage} />;
      case 'benchmark':
        return <BenchmarkingPage benchmarkData={benchmarkData} setBenchmarkData={setBenchmarkData} />;
      case 'visualizer':
        return <VisualizerPage />;
      case 'aichat':
        return <AIChatPage benchmarkData={benchmarkData} />;
      case 'heatmap':
        return <HeatmapAnalysisPage benchmarkData={benchmarkData} />;
      case 'prediction':
        return <AIPredictionPage benchmarkData={benchmarkData} />;
      case 'comparison':
        return <AlgorithmComparisonPage benchmarkData={benchmarkData} />;
      case 'about':
        return <AboutProjectPage />;
      default:
        return <HomePage setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-app)] text-[var(--text-primary)] relative overflow-hidden transition-colors duration-300">
      
      {/* Mobile Top Navigation */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glass-header border-b border-[var(--glass-border)] backdrop-blur-md sticky top-0 z-50 text-[var(--text-primary)]">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-500 animate-pulse" />
          <span className="font-extrabold text-[var(--text-primary)] tracking-tight text-sm">Complexity Analyzer</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-all cursor-pointer flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[var(--text-primary)] hover:text-indigo-500 p-1.5 rounded-lg focus:outline-none bg-[var(--glass-bg)] border border-[var(--glass-border)]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass-nav flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:w-64 shrink-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar content */}
        <div className="px-6 py-8 space-y-8 flex-1">

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-xs border border-[var(--glass-border)]' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)]'}
                  `}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--sidebar-active-text)]' : 'text-[var(--text-secondary)]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Global Memory telemetry indicator */}
        <div className="p-4 mx-4 mb-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-md flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold shadow-2xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Telemetry Cache:</span>
          </div>
          <span className="font-mono bg-[var(--card-hover-bg)] border border-[var(--glass-border)] px-2 py-0.5 rounded-md font-bold text-[var(--text-primary)]">
            {benchmarkData.length} runs
          </span>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 min-w-0 flex flex-col relative z-0">
        
        {/* Top Desktop header bar */}
        <header className="hidden md:flex items-center justify-end px-8 py-5 glass-header border-b border-[var(--glass-border)] sticky top-0 z-30">
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-all cursor-pointer flex items-center justify-center shadow-xs"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>


          </div>
        </header>

        {/* Page Content Panel */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {renderActivePage()}
        </div>
      </main>

      {/* Mobile menu backdrop blur overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/10 backdrop-blur-xs md:hidden"
        />
      )}
    </div>
  );
}
