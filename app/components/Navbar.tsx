"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import "../css/login-button.css";

const SCROLL_THRESHOLD = 24;

export default function Navbar() {
  const [solutionsActive, setSolutionsActive] = useState(false);
  const [resourcesActive, setResourcesActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll(); // set initial state
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (session?.user) {
      router.push('/organizations');
    } else {
      router.push('/login');
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 w-full z-50 ${scrolled ? "pt-4 px-4 md:px-6" : "pt-0 px-0"}`}
      style={{
        fontFamily: "var(--font-poppins)",
        transition: "padding 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      <nav
        className={`backdrop-blur-sm bg-[#0f0f11]/80 border-white/5 mx-auto ${
          scrolled
            ? "max-w-5xl rounded-2xl border shadow-lg shadow-black/20 translate-y-0"
            : "max-w-full rounded-none border-b border-t-0 border-l-0 border-r-0 shadow-none -translate-y-px"
        }`}
        style={{
          transition:
            "max-width 0.32s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.32s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.32s cubic-bezier(0.32, 0.72, 0, 1), transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
      <div className="flex items-center justify-between px-6 py-6 gap-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <div className="pr-4 flex-shrink-0">
            <img 
              src="/Full-logo.png" 
              alt="Logo" 
              className="h-12 w-auto"
              style={{ minWidth: 'fit-content' }}
            />
          </div>
          
          {/* Navigation tabs */}
          <div className="flex items-center gap-8">
            <a 
              href="#" 
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                setSolutionsActive(!solutionsActive);
              }}
            >
              Solutions
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${solutionsActive ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <a 
              href="#" 
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                setResourcesActive(!resourcesActive);
              }}
            >
              Resources
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${resourcesActive ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <a href="#" className="text-sm text-white/70 hover:text-white transition-colors duration-200">
              Pricing
            </a>
            <a href="#" className="text-sm text-white/70 hover:text-white transition-colors duration-200">
              Contact
            </a>
          </div>
        </div>
          
          {/* Login button */}
          <a
            href="/login"
            className="ml-25 login-play-button"
            onClick={handleLoginClick}
          >
            <span className="now">now!</span>
            <span className="play">login</span>
          </a>
      </div>
      </nav>
    </div>
  );
}

