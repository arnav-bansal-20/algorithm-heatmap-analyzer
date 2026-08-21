import React, { useEffect, useRef } from 'react';
import { Play, TrendingUp, Grid, BarChart3, Info, LayoutGrid } from 'lucide-react';
import { api } from '../services/api';

export default function Home({ setPage }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const particles = [];
    const particleCount = Math.min(35, Math.floor((width * height) / 18000));

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? '#06b6d4' : '#8b5cf6'; // Cyan or Violet
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
            const alpha = (1 - dist / maxDistance) * (isLight ? 0.12 : 0.22);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isLight 
              ? `rgba(79, 70, 229, ${alpha})` 
              : `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

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
    <div className="page-transition space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl p-8 md:p-12 text-[var(--text-primary)] shadow-xl">
        {/* Particle Canvas Background */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70"
        />

        {/* Soft neon backdrops */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--neon-violet)]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--neon-cyan)]/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl space-y-6">

          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] via-[var(--neon-violet)] to-[var(--neon-cyan)]">
            Algorithm Complexity Heatmap Visualizer
          </h1>
          
          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl font-medium">
            A state-of-the-art DAA benchmarking platform. Analyze practical execution times, memory usage, and operation counts, visualize performance through interactive heatmaps, and use mathematical regression models to predict algorithm growth trends.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => setPage('benchmark')}
              className="flex items-center gap-2 btn-neon font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> Start Benchmarking
            </button>
            <button
              onClick={() => setPage('visualizer')}
              className="flex items-center gap-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <LayoutGrid className="w-4 h-4 text-[var(--text-secondary)]" /> Try Visualizer
            </button>
          </div>
        </div>
      </div>


      {/* Features Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Analyzer Workspaces</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div 
            onClick={() => setPage('benchmark')}
            className="glass-card rounded-2xl p-6 space-y-4 cursor-pointer hover:border-[var(--neon-cyan)]/50"
          >
            <div className="p-3 bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] rounded-xl w-fit">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-lg">1. Benchmarking</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Configure algorithms, choose dataset distributions (random, sorted, etc.), choose sizes from 10 to 100,000, and watch them execute live.
            </p>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => setPage('heatmap')}
            className="glass-card rounded-2xl p-6 space-y-4 cursor-pointer hover:border-[var(--neon-violet)]/50"
          >
            <div className="p-3 bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] rounded-xl w-fit">
              <Grid className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-lg">2. Heatmap Analysis</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Visualize algorithm execution speed across varying dimensions. Color intensity dynamically flags slow (red) vs efficient (green) steps.
            </p>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => setPage('prediction')}
            className="glass-card rounded-2xl p-6 space-y-4 cursor-pointer hover:border-[var(--neon-rose)]/50"
          >
            <div className="p-3 bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] rounded-xl w-fit">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-lg">3. Complexity Prediction</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Fit runtimes to logarithmic, linear, and quadratic regression functions to find the exact growth class and generate performance summaries.
            </p>
          </div>

          {/* Card 4 */}
          <div 
            onClick={() => setPage('comparison')}
            className="glass-card rounded-2xl p-6 space-y-4 cursor-pointer hover:border-[var(--neon-cyan)]/50"
          >
            <div className="p-3 bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] rounded-xl w-fit">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-lg">4. Algorithm Comparison</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Run side-by-side performance comparisons (time, ops, memory). View a leaderboard rankings list of execution metrics.
            </p>
          </div>
        </div>
      </div>

      {/* DAA Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 glass-card rounded-2xl p-8 space-y-4 animate-card-glow">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Project Overview</h3>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            This visualization tool was developed to study how algorithm execution performs in practice versus theoretical Big-O complexity class analysis. While Big-O is standard for asymptotic bounds, theoretical models do not account for machine-level factors such as CPU cache behaviors, call stack overhead, and memory consumption.
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            By running benchmarks locally on Python, this suite measures actual execution time, step operation counts, and peak memory allocation. This helps evaluate how different data structures and input distributions (such as sorted, reversed, or random inputs) behave in real-world scenarios.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--neon-cyan)]" /> Quick Setup Instructions
            </h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2 list-disc list-inside">
              <li>Navigate to <b>Benchmarking</b> in the sidebar.</li>
              <li>Select your target algorithms.</li>
              <li>Generate datasets (up to 100,000).</li>
              <li>Run benchmarks to stream telemetry.</li>
              <li>Check the heatmaps and review complexity curves.</li>
            </ul>
          </div>
          
          <div className="pt-4 border-t border-[var(--glass-border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>DAA Lab Coursework</span>
            <span>May 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
