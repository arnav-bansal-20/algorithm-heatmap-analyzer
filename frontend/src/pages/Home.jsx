import React, { useEffect, useRef, useState } from 'react';
import {
  Code, Play, Grid, TrendingUp, BarChart3, LayoutGrid,
  Sparkles, ShieldCheck, Cpu, ArrowRight, History, CheckCircle2,
  Clock, Zap, BookOpen, Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function Home({ setPage }) {
  const canvasRef = useRef(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    api.getStudentHistory(4)
      .then(res => setRecentAnalyses(res.analyses || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const particles = [];
    const particleCount = Math.min(30, Math.floor((width * height) / 20000));

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? '#06b6d4' : '#8b5cf6';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const drawLines = () => {
      const isLight = document.documentElement.classList.contains('light');
      const maxDistance = 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (isLight ? 0.1 : 0.2);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isLight ? `rgba(79, 70, 229, ${alpha})` : `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawLines();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Hero Analytics Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl p-8 md:p-12 text-[var(--text-primary)] shadow-2xl">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--neon-violet)]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--neon-cyan)]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Student Algorithm Analyzer 2.0
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium">DAA Pedagogical Platform</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
            Analyze, Validate & Compare Your Algorithms
          </h1>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed font-normal">
            Submit custom code in <strong>Python, C, C++, Java, or JavaScript</strong>. Verify correctness against test oracles, benchmark with standard algorithms, fit empirical regression models, and receive AI-guided optimization feedback.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => setPage('analyze')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02]"
            >
              <Code className="w-4 h-4" />
              <span>Analyze My Algorithm</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => setPage('comparison')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm glass-card border border-[var(--glass-border)] text-[var(--text-primary)] hover:border-indigo-500/40 transition cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Compare Algorithms</span>
            </button>
          </div>
        </div>
      </div>

      {/* Platform Telemetry Pillars */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-card space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>5 Languages</span>
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)]">Python • C • C++ • Java • JS</div>
          <div className="text-[11px] text-[var(--text-secondary)]">Standardized execution runner</div>
        </div>

        <div className="p-4 rounded-2xl glass-card space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Isolated Sandbox</span>
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)]">Zero Network • rlimits</div>
          <div className="text-[11px] text-[var(--text-secondary)]">Subprocess isolation & timeout guards</div>
        </div>

        <div className="p-4 rounded-2xl glass-card space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Dual Complexity</span>
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)]">AST + Regression</div>
          <div className="text-[11px] text-[var(--text-secondary)]">O(1) through O(n!) curve fitting</div>
        </div>

        <div className="p-4 rounded-2xl glass-card space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Gemini AI Tutor</span>
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)]">11-Section Report</div>
          <div className="text-[11px] text-[var(--text-secondary)]">Grounded in measured backend metrics</div>
        </div>
      </div>

      {/* Primary Workspaces Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
            Core Educational Workspaces
          </h2>
          <span className="text-xs text-[var(--text-secondary)]">
            Explore interactive analysis tools
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Analyze My Algorithm */}
          <div
            onClick={() => setPage('analyze')}
            className="p-6 rounded-2xl glass-card border border-indigo-500/30 hover:border-indigo-500 space-y-3 cursor-pointer group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition">
              1. Analyze My Algorithm (Primary)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Submit your own algorithm. Validates correctness with problem-specific test suites, benchmarks against standard algorithms, and estimates theoretical/empirical complexity.
            </p>
          </div>

          {/* Card 2: Compare Algorithms */}
          <div
            onClick={() => setPage('comparison')}
            className="p-6 rounded-2xl glass-card space-y-3 cursor-pointer group transition-all hover:border-cyan-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition">
              2. Compare Algorithms
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Side-by-side performance metrics across input sizes. Inspect leaderboard rankings, execution times, memory footprints, and operation counts.
            </p>
          </div>

          {/* Card 3: Performance Heatmap */}
          <div
            onClick={() => setPage('heatmap')}
            className="p-6 rounded-2xl glass-card space-y-3 cursor-pointer group transition-all hover:border-violet-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
              <Grid className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-violet-400 transition">
              3. Performance Heatmap
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Interactive 2D matrix visualizing execution latency across algorithms and input scales. Supports both column-relative and logarithmic absolute scaling.
            </p>
          </div>

          {/* Card 4: Complexity Analysis */}
          <div
            onClick={() => setPage('complexity')}
            className="p-6 rounded-2xl glass-card space-y-3 cursor-pointer group transition-all hover:border-rose-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-rose-400 transition">
              4. Complexity Analysis
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Regression models fit execution times against standard candidate complexity classes: O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2^n), O(n!).
            </p>
          </div>

          {/* Card 5: Code Optimization */}
          <div
            onClick={() => setPage('optimization')}
            className="p-6 rounded-2xl glass-card space-y-3 cursor-pointer group transition-all hover:border-amber-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition">
              5. Code Optimization
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Identify bottlenecks, unnecessary nested passes, and missing termination conditions. Review suggested optimizations and benchmark live speedups.
            </p>
          </div>

          {/* Card 6: Algorithm Visualizer */}
          <div
            onClick={() => setPage('visualizer')}
            className="p-6 rounded-2xl glass-card space-y-3 cursor-pointer group transition-all hover:border-emerald-500/50"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition">
              6. Algorithm Visualizer
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Step-by-step visualizer for sorting, pathfinding, dynamic programming grids, and string matching with interactive step controls and custom inputs.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Analysis Activity Stream */}
      {recentAnalyses.length > 0 && (
        <div className="p-6 rounded-3xl glass-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Recent Student Submissions
            </h3>
            <button
              onClick={() => setPage('analyze')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Open Analyzer →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {recentAnalyses.map(a => (
              <div
                key={a.id}
                onClick={() => setPage('analyze')}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition text-left space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 truncate">{a.algorithm_name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${a.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {a.is_correct ? 'Passed' : 'Mismatch'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{a.language.toUpperCase()} • {a.category}</span>
                  <span className="text-indigo-400 font-mono font-semibold">{a.predicted_class}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
