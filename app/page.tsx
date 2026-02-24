'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from "./components/Navbar";
import WorkflowCurvedConnector from "./components/WorkflowCurvedConnector";

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const featuresRef = useRef<HTMLElement | null>(null);
  const workflowRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    workflow: false,
  });
  const [codebaseConnected, setCodebaseConnected] = useState(false);
  const [ragActiveStage, setRagActiveStage] = useState(0); // 0 = not started, 1–5 = that stage has active loading bar
  const [docReady, setDocReady] = useState(false);
  const ragCycleCompleteRef = useRef(false);
  const codebaseDirRef = useRef<HTMLDivElement | null>(null);
  const codebaseScrollThumbRef = useRef<HTMLDivElement | null>(null);

  // When codebase is visible, animate scroll and sync custom scrollbar thumb with the loop (down then up)
  useEffect(() => {
    const el = codebaseDirRef.current;
    const thumb = codebaseScrollThumbRef.current;
    if (!codebaseConnected || !el) return;

    const duration = 4500; // 4.5s down, 4.5s up
    let phase: 'down' | 'up' = 'down';
    let startTime: number | null = null;

    const updateThumb = () => {
      if (!thumb) return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const trackHeight = el.clientHeight;
      if (maxScroll <= 0) return;
      const thumbHeight = Math.max((el.clientHeight / el.scrollHeight) * trackHeight, 28);
      const thumbTop = (el.scrollTop / maxScroll) * (trackHeight - thumbHeight);
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${thumbTop}px)`;
    };

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) * (1 - t); // ease-in-out-ish

      if (phase === 'down') {
        el.scrollTop = maxScroll * eased;
        if (t >= 1) {
          phase = 'up';
          startTime = now;
        }
      } else {
        el.scrollTop = maxScroll * (1 - eased);
        if (t >= 1) {
          phase = 'down';
          startTime = now;
        }
      }
      updateThumb();
      frameRef.current = requestAnimationFrame(tick);
    };

    let frameRef = { current: 0 };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [codebaseConnected]);

  // When workflow is visible: show GitHub connect for 3s, then reveal codebase
  useEffect(() => {
    if (!isVisible.workflow) return;
    const t = setTimeout(() => setCodebaseConnected(true), 3000);
    return () => clearTimeout(t);
  }, [isVisible.workflow]);

  // After codebase is visible, start RAG pipeline: active stage 1, then cycle 1→2→3→4→5→1… with loading bar per stage
  useEffect(() => {
    if (!codebaseConnected || !isVisible.workflow) return;
    const startRag = setTimeout(() => setRagActiveStage(1), 500);
    return () => clearTimeout(startRag);
  }, [codebaseConnected, isVisible.workflow]);

  // When a RAG stage is active, run loading bar for ~1.2s then advance (or loop to 1 and set doc ready after first full cycle)
  useEffect(() => {
    if (ragActiveStage < 1 || ragActiveStage > 5) return;
    const t = setTimeout(() => {
      if (ragActiveStage === 5) {
        if (!ragCycleCompleteRef.current) {
          ragCycleCompleteRef.current = true;
          setDocReady(true);
        }
        setRagActiveStage(1);
      } else {
        setRagActiveStage((s) => s + 1);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [ragActiveStage]);

  useEffect(() => {
    // Animate hero section on page load - trigger immediately
    setIsVisible((prev) => ({ ...prev, hero: true }));

    const observers: IntersectionObserver[] = [];

    const createObserver = (ref: React.RefObject<HTMLElement | null>, key: keyof typeof isVisible) => {
      if (!ref.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [key]: true }));
          }
        },
        { threshold: 0.05, rootMargin: '0px 0px -300px 0px' }
      );

      observer.observe(ref.current);
      observers.push(observer);
    };

    createObserver(featuresRef, 'features');
    createObserver(workflowRef, 'workflow');

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0f0f11]">
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className={`relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-40 md:pt-56 pb-12 transition-all duration-1000 ${
            isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 z-0 hidden md:block bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-flow motion-reduce:animate-none">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f11] via-transparent to-[#0f0f11]"></div>
            {/* Blur Effect */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 bg-[var(--color-primary)]/30 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"></div>
          </div>
          
          {/* Content Container */}
          <div className="container relative z-10 px-4 mx-auto max-w-7xl">
            <div className="flex flex-col items-center text-center space-y-6">
            {/* Main Heading */}
            <h1 className={`text-6xl md:text-7xl font-bold leading-tight transition-all duration-700 ${
              isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: isVisible.hero ? '50ms' : '0ms' }}>
              <span className="block text-white">Understand Your Codebase</span>
              <span className="block text-[var(--color-primary)]">With AI Intelligence</span>
            </h1>

            {/* Subtitle */}
            <p className={`text-xl text-white/70 max-w-2xl transition-all duration-700 ${
              isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: isVisible.hero ? '100ms' : '0ms' }}>
              Autonomous documentation, onboarding services, and repository-wide insights. 
              From code to comprehension in seconds.
            </p>

            {/* CTA Button */}
            <button className={`mt-8 px-8 py-4 bg-[#171717] border border-[#262626] hover:bg-[#262626] text-white font-semibold rounded cursor-pointer transition-all duration-300 flex items-center gap-3 ${
              isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: isVisible.hero ? '150ms' : '0ms' }}>
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            {/* Video */}
            <div className={`mt-12 w-full max-w-4xl relative transition-all duration-700 ${
              isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: isVisible.hero ? '200ms' : '0ms' }}>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-[var(--color-primary)]/40 rounded-2xl blur-[80px] -z-10 opacity-75"></div>
              <video
                src="/videos/landing-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-2xl border border-[#262626] shadow-2xl relative z-10"
              />
            </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          ref={featuresRef}
          className={`py-24 relative overflow-hidden bg-[#0f0f11] transition-all duration-700 ${
            isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Background Blur Effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-[128px]"></div>
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-[128px]"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left Column - Content */}
                <div className={`transition-all duration-700 delay-100 ${
                  isVisible.features ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                      <path d="M20 2v4"></path>
                      <path d="M22 4h-4"></path>
                      <circle cx="4" cy="20" r="2"></circle>
                    </svg>
                    The Future of Development
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-tight text-white">
                    Intelligent Code <span className="text-[var(--color-primary)]">Understanding</span> <br />for Modern Teams.
                  </h2>
                  
                  <div className="space-y-6 text-lg text-white/70 leading-relaxed">
                    <p>
                      NeuroCode isn't just a platform; it's a new way of understanding code. We are an <span className="text-white font-medium">AI-driven organization</span> where intelligent agents autonomously document, analyze, and optimize your entire codebase.
                    </p>
                    <p>
                      We believe documentation should be <span className="text-[var(--color-accent)] font-medium italic">automatically generated</span>. By leveraging multi-agent AI systems, we close the gap between code complexity and developer understanding, allowing teams to onboard faster while AI handles the heavy lifting.
                    </p>
                  </div>
                  
                  <div className="mt-10 flex flex-wrap gap-6">
                    <div className="flex flex-col">
                      <span className="text-3xl font-bold text-white">90%</span>
                      <span className="text-sm text-white/50 uppercase tracking-wider font-semibold">Faster Onboarding</span>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-bold text-white">100%</span>
                      <span className="text-sm text-white/50 uppercase tracking-wider font-semibold">Auto-Documented</span>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-bold text-white">∞</span>
                      <span className="text-sm text-white/50 uppercase tracking-wider font-semibold">Intelligence</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Feature Cards */}
                <div className={`grid gap-6 transition-all duration-700 delay-200 ${
                  isVisible.features ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}>
                  {/* Card 1 */}
                  <div className={`relative bg-[#171717]/50 border border-[#262626] backdrop-blur-sm rounded overflow-hidden group hover:border-[var(--color-primary)]/50 transition-all duration-500 p-6 ${
                    isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`} style={{ transitionDelay: isVisible.features ? '300ms' : '0ms' }}>
                    <div className="pointer-events-none absolute -inset-px rounded opacity-0 transition duration-300 group-hover:opacity-100" style={{background: `radial-gradient(650px circle at 0px 0px, rgba(var(--color-primary-rgb), 0.1), transparent 80%)`}}></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none"></div>
                    <div className="relative z-10">
                      <div className="flex items-start gap-5">
                        <div className="p-3 rounded flex-shrink-0 bg-[var(--color-primary)]/10">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[var(--color-primary)]" aria-hidden="true">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Auto-Generated Documentation</h3>
                          <p className="text-white/70 text-sm leading-relaxed">AI agents analyze your entire codebase and generate comprehensive documentation automatically, keeping it always up-to-date.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className={`relative bg-[#171717]/50 border border-[#262626] backdrop-blur-sm rounded overflow-hidden group hover:border-[var(--color-primary)]/50 transition-all duration-500 p-6 ${
                    isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`} style={{ transitionDelay: isVisible.features ? '400ms' : '0ms' }}>
                    <div className="pointer-events-none absolute -inset-px rounded opacity-0 transition duration-300 group-hover:opacity-100" style={{background: `radial-gradient(650px circle at 0px 0px, rgba(var(--color-primary-rgb), 0.1), transparent 80%)`}}></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none"></div>
                    <div className="relative z-10">
                      <div className="flex items-start gap-5">
                        <div className="p-3 rounded flex-shrink-0 bg-[var(--color-accent)]/10">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[var(--color-accent)]" aria-hidden="true">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Instant Onboarding</h3>
                          <p className="text-white/70 text-sm leading-relaxed">New developers get up to speed in hours, not weeks. Personalized onboarding paths powered by AI understand your codebase structure.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className={`relative bg-[#171717]/50 border border-[#262626] backdrop-blur-sm rounded overflow-hidden group hover:border-[var(--color-primary)]/50 transition-all duration-500 p-6 ${
                    isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`} style={{ transitionDelay: isVisible.features ? '500ms' : '0ms' }}>
                    <div className="pointer-events-none absolute -inset-px rounded opacity-0 transition duration-300 group-hover:opacity-100" style={{background: `radial-gradient(650px circle at 0px 0px, rgba(var(--color-primary-rgb), 0.1), transparent 80%)`}}></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none"></div>
                    <div className="relative z-10">
                      <div className="flex items-start gap-5">
                        <div className="p-3 rounded flex-shrink-0 bg-green-500/10">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-500" aria-hidden="true">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Repository Intelligence</h3>
                          <p className="text-white/70 text-sm leading-relaxed">Graph-based code understanding captures dependencies, relationships, and patterns across your entire repository in real-time.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                      {/* — horizontal strip “live” */}
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section - Three-column flow (codebase → RAG pipeline → docs) */}
        <section
          ref={workflowRef}
          className={`py-24 relative overflow-hidden bg-[#0a0a0b] transition-all duration-700 ${
            isVisible.workflow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--color-primary)] blur-[100px] opacity-20" />
            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-[var(--color-primary)] blur-[80px] opacity-15" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/50 via-transparent to-[#0a0a0b]/50 pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold mb-4">
                How it works
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                From Repo to Docs in One Flow
              </h2>
              <p className="text-white/60 max-w-xl mx-auto">
                Your codebase flows through our RAG pipeline into living documentation.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-8 lg:gap-0 max-w-6xl mx-auto">
              {/* Left: Your codebase – Connect to GitHub then reveal codebase */}
              <div className={`relative flex-1 min-w-0 max-w-md mx-auto lg:mx-0 transition-all duration-700 ${isVisible.workflow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: isVisible.workflow ? '100ms' : '0ms' }}>
                <div className="workflow-panel h-full flex flex-col rounded-2xl">
                  <div className="workflow-stage-title">
                    <span className="workflow-stage-title-icon workflow-stage-title-icon-code" aria-hidden />
                    <span>Your codebase</span>
                  </div>
                  <div className="flex-1 flex flex-col px-5 pb-5 min-h-0">
                    <div className="flex-1 rounded-xl bg-[#1a1a1d]/60 flex items-center justify-center p-5 min-h-[200px] relative overflow-hidden">
                      {!codebaseConnected ? (
                        <button
                          type="button"
                          onClick={() => setCodebaseConnected(true)}
                          className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 px-6 py-5 transition-all duration-300 group workflow-connect-btn"
                        >
                          <div className="w-12 h-12 rounded-xl bg-[#262626] flex items-center justify-center group-hover:bg-[var(--color-primary)]/15 transition-colors">
                            <svg className="w-6 h-6 text-white/60 group-hover:text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                          </div>
                          <span className="text-sm font-medium text-white/90">Connect repository</span>
                          <span className="text-xs text-white/50">Connect to GitHub</span>
                        </button>
                      ) : (
                        <div className="w-full max-w-[260px] mx-auto workflow-codebase-reveal">
                          <div className="rounded-xl bg-[#0d0d0f]/90 border border-white/5 overflow-hidden">
                            <div className="flex items-center gap-1.5 px-2.5 py-2 bg-white/[0.04] border-b border-white/5">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                              <span className="ml-1 text-[10px] text-white/40 font-mono">src/</span>
                            </div>
                            <div className="flex items-stretch border-t border-white/5">
                              <div ref={codebaseDirRef} className="flex-1 min-w-0 h-[140px] overflow-y-auto overflow-x-hidden workflow-codebase-dir">
                                <div className="p-2.5 space-y-1">
                                  {[
                                    { type: 'folder' as const, name: 'components/', primary: true },
                                    { type: 'file' as const, name: 'Button.tsx', primary: true },
                                    { type: 'file' as const, name: 'api.ts', primary: true },
                                    { type: 'folder' as const, name: 'lib/', primary: true },
                                    { type: 'file' as const, name: 'utils.ts', primary: false },
                                    { type: 'file' as const, name: 'types.ts', primary: false },
                                    { type: 'folder' as const, name: 'hooks/', primary: false },
                                    { type: 'file' as const, name: 'useAuth.ts', primary: false },
                                    { type: 'file' as const, name: 'useFetch.ts', primary: false },
                                    { type: 'folder' as const, name: 'styles/', primary: false },
                                    { type: 'file' as const, name: 'theme.ts', primary: false },
                                    { type: 'file' as const, name: 'index.ts', primary: false },
                                    { type: 'folder' as const, name: 'config/', primary: false },
                                    { type: 'file' as const, name: 'constants.ts', primary: false },
                                    { type: 'file' as const, name: 'env.ts', primary: false },
                                  ].map((item, idx) => (
                                    <div key={idx} className={`flex items-center gap-1.5 ${item.type === 'folder' ? '' : 'pl-4'} ${item.primary ? 'text-white/50' : 'text-white/40'}`}>
                                      {item.type === 'folder' ? (
                                        <svg className={`w-4 h-4 flex-shrink-0 ${item.primary ? 'text-[var(--color-primary)]/80' : 'text-white/30'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
                                      ) : (
                                        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${item.primary ? 'text-[var(--color-primary)]/60' : 'text-white/30'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                                      )}
                                      <span className="text-[10px] font-mono truncate">{item.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="relative w-[6px] h-[140px] flex-shrink-0 bg-white/[0.06] rounded-r overflow-hidden workflow-codebase-scrollbar-track">
                                <div ref={codebaseScrollThumbRef} className="workflow-codebase-scrollbar-thumb absolute left-0 top-0 w-full rounded min-h-[28px]" style={{ height: 28, transform: 'translateY(0)' }} />
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-center gap-1">
                            <div className="h-0.5 w-4 rounded bg-[var(--color-primary)]/40" />
                            <div className="h-0.5 w-6 rounded bg-[var(--color-primary)]/30" />
                            <div className="h-0.5 w-3 rounded bg-[var(--color-primary)]/50" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <WorkflowCurvedConnector />

              {/* Middle: RAG pipeline – aligned rows, loading bar per stage, loops */}
              <div className={`relative flex-1 min-w-0 max-w-md mx-auto lg:mx-0 transition-all duration-700 ${isVisible.workflow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: isVisible.workflow ? '200ms' : '0ms' }}>
                <div className="workflow-panel h-full flex flex-col rounded-2xl">
                  <div className="workflow-stage-title">
                    <span className="workflow-stage-title-icon workflow-stage-title-icon-rag" aria-hidden />
                    <span>RAG pipeline</span>
                  </div>
                  <div className="flex-1 flex flex-col px-5 pb-5 min-h-0">
                    <div className="flex-1 rounded-xl bg-[#1a1a1d]/60 flex items-center justify-center p-4 min-h-[200px]">
                      <div className="w-full max-w-[240px]">
                        {[
                          { icon: 'inbox', color: 'workflow-node-orange', label: 'Ingest' },
                          { icon: 'scissors', color: 'workflow-node-purple', label: 'Chunk' },
                          { icon: 'cube', color: 'workflow-node-green', label: 'Embed' },
                          { icon: 'search', color: 'workflow-node-blue', label: 'Index' },
                          { icon: 'sparkles', color: 'workflow-node-pink', label: 'Generate' },
                        ].map(({ icon, color, label }, i) => {
                          const stageNum = i + 1;
                          const isActive = ragActiveStage === stageNum;
                          const isComplete = ragActiveStage > stageNum;
                          const visible = isActive || isComplete;
                          return (
                            <div key={i} className="workflow-rag-row">
                              <div className="workflow-rag-row-icon">
                                <div className={`workflow-pipeline-node ${color} ${visible ? 'workflow-node-visible' : ''}`}>
                                  {icon === 'inbox' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>}
                                  {icon === 'scissors' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>}
                                  {icon === 'cube' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                                  {icon === 'search' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                                  {icon === 'sparkles' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                                </div>
                              </div>
                              <span className={`workflow-rag-label ${visible ? 'workflow-rag-label-visible' : ''}`}>{label}</span>
                              <div className="workflow-rag-bar-wrap">
                                {isActive && <div className="workflow-rag-bar" key={ragActiveStage} />}
                                {isComplete && <div className="workflow-rag-bar workflow-rag-bar-full" />}
                              </div>
                              {i < 4 && <div className="workflow-rag-connector" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <WorkflowCurvedConnector mirror />

              {/* Right: Documentation generation – generating state then doc ready */}
              <div className={`relative flex-1 min-w-0 max-w-md mx-auto lg:mx-0 transition-all duration-700 ${isVisible.workflow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: isVisible.workflow ? '300ms' : '0ms' }}>
                <div className="workflow-panel h-full flex flex-col rounded-2xl">
                  <div className="workflow-stage-title">
                    <span className="workflow-stage-title-icon workflow-stage-title-icon-doc" aria-hidden />
                    <span>Documentation generation</span>
                  </div>
                  <div className="flex-1 flex flex-col px-5 pb-5 min-h-0">
                    <div className="flex-1 rounded-xl bg-[#1a1a1d]/60 flex items-center justify-center p-5 min-h-[200px] relative overflow-hidden">
                      <div className="w-full max-w-[200px]">
                        {!docReady ? (
                          <div className="flex flex-col items-center gap-4 workflow-doc-generating">
                            <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center">
                              <svg className="w-7 h-7 text-[var(--color-primary)] animate-[workflow-doc-spin_1.5s_linear_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-white/90">Generating docs</p>
                              <p className="text-xs text-white/50 mt-0.5">From your codebase...</p>
                            </div>
                            <div className="flex gap-1">
                              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]/60 animate-[workflow-doc-dot_0.6s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]/60 animate-[workflow-doc-dot_0.6s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }} />
                              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]/60 animate-[workflow-doc-dot_0.6s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }} />
                            </div>
                          </div>
                        ) : (
                          <div className="workflow-doc-ready workflow-doc-loop">
                            <div className="rounded-lg bg-[#0d0d0f]/90 border border-white/5 overflow-hidden mb-3 workflow-doc-card">
                              <div className="px-2.5 py-2 bg-[var(--color-primary)]/10 border-b border-white/5 flex items-center gap-2">
                                <svg className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold text-white/90 truncate">Getting Started</p>
                                  <p className="text-[8px] text-white/50">Overview · Quick start</p>
                                </div>
                              </div>
                              <div className="p-2 space-y-1.5 workflow-doc-lines">
                                <div className="h-1 w-full rounded bg-white/20" />
                                <div className="h-1 w-4/5 rounded bg-white/15" />
                                <div className="h-1 w-3/4 rounded bg-white/10" />
                                <div className="h-1 w-1/2 rounded bg-[var(--color-primary)]/30 workflow-doc-line-highlight" />
                              </div>
                            </div>
                            <div className="workflow-doc-cycle mb-3">
                              <p className="text-[8px] text-white/40 uppercase tracking-wider mb-1.5">Also available</p>
                              <div className="flex flex-wrap justify-center gap-1.5">
                                {['API Reference', 'Architecture', 'Guides'].map((title, idx) => (
                                  <span key={title} className="workflow-doc-cycle-item rounded bg-white/5 px-2 py-1 text-[8px] text-white/60 border border-white/10" style={{ animationDelay: `${idx * 0.4}s` }}>{title}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-center">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-[9px] font-medium text-emerald-400/90 workflow-doc-live">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live · auto-sync
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-[#262626] bg-[#171717] overflow-hidden">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-12">
                {/* Brand column */}
                <div className="col-span-2 md:col-span-4 lg:col-span-1 lg:pr-8">
                  <a href="/" className="inline-block">
                    <img src="/Full-logo.png" alt="NeuroCode" className="h-8 w-auto" />
                  </a>
                  <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
                    AI-driven documentation and codebase intelligence for modern teams.
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <a href="#" className="text-white/40 hover:text-[var(--color-primary)] transition-colors" aria-label="GitHub">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                    </a>
                    <a href="#" className="text-white/40 hover:text-[var(--color-primary)] transition-colors" aria-label="Twitter">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>
                    <a href="#" className="text-white/40 hover:text-[var(--color-primary)] transition-colors" aria-label="LinkedIn">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    </a>
                  </div>
                </div>

                {/* Product */}
                <div>
                  <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-4">Product</h4>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Features</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Documentation</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Pricing</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Changelog</a></li>
                  </ul>
                </div>

                {/* Company */}
                <div>
                  <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-4">Company</h4>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">About</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Blog</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Careers</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Contact</a></li>
                  </ul>
                </div>

                {/* Resources */}
                <div>
                  <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-4">Resources</h4>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Help Center</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Community</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Status</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Partners</a></li>
                  </ul>
                </div>

                {/* Legal */}
                <div>
                  <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-4">Legal</h4>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Privacy</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Terms</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Security</a></li>
                    <li><a href="#" className="text-sm text-white/50 hover:text-[var(--color-primary)] transition-colors">Cookies</a></li>
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-16 pt-8 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-white/40">
                  © {new Date().getFullYear()} NeuroCode. All rights reserved.
                </p>
                <p className="text-sm text-white/40">
                  Built for developers who ship.
                </p>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
