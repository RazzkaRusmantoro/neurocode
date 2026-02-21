'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from "./components/Navbar";

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const featuresRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
  });

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
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
