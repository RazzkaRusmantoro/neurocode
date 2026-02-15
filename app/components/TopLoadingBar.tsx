'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function TopLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);
  const previousPathnameRef = useRef(pathname);

  // Function to start loading
  const startLoading = useCallback(() => {
    isNavigatingRef.current = true;
    setLoading(true);
    setProgress(0);
    progressRef.current = 0;

    // Clear any existing intervals/timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }

    // Simulate progress (slow down as it approaches 90%)
    intervalRef.current = setInterval(() => {
      progressRef.current = Math.min(
        progressRef.current + (100 - progressRef.current) * 0.05,
        90
      );
      setProgress(progressRef.current);
    }, 100);
  }, []);

  // Start loading bar on link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the closest anchor tag
      const anchor = target.closest('a');
      if (!anchor) return;

      // Get href - try multiple methods
      let href = anchor.getAttribute('href');
      
      // If no href attribute, try the href property (for dynamically set links)
      if (!href && anchor instanceof HTMLAnchorElement && anchor.href) {
        try {
          const url = new URL(anchor.href);
          // Only proceed if it's a same-origin link
          if (url.origin === window.location.origin) {
            href = url.pathname + url.search + url.hash;
          } else {
            return; // External link
          }
        } catch {
          // If URL parsing fails, might be a relative path
          if (anchor.href.startsWith(window.location.origin)) {
            href = anchor.href.replace(window.location.origin, '');
          } else {
            return;
          }
        }
      }
      
      // Skip if no href or just a hash/anchor (unless it's a hash navigation)
      if (!href) return;
      if (href === '#') return;
      
      // Skip external links (absolute URLs to different origins)
      if (href.startsWith('http') && !href.startsWith(window.location.origin) && !href.startsWith('/')) {
        return;
      }
      
      // Skip mailto, tel, etc.
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Normalize for comparison (remove origin, query, hash)
      const normalizedHref = href.replace(window.location.origin, '').split('?')[0].split('#')[0];
      const currentPath = pathname.split('?')[0].split('#')[0];

      // Skip if it's the same path (unless it has a hash for same-page navigation)
      if (normalizedHref === currentPath && !href.includes('#')) {
        return;
      }

      // Start loading for any valid navigation
      startLoading();
    };

    // Use capture phase to catch clicks before Next.js handles them
    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [pathname, startLoading]);

  // Handle pathname changes (both from clicks and programmatic navigation)
  useEffect(() => {
    // Only proceed if pathname actually changed
    if (previousPathnameRef.current === pathname) return;
    
    const wasNavigating = isNavigatingRef.current;
    previousPathnameRef.current = pathname;

    // If we weren't navigating, this is a programmatic navigation (router.push, etc.)
    // Start loading immediately
    if (!wasNavigating) {
      startLoading();
      // Give it time to show, then complete
      setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setProgress(100);
        completionTimeoutRef.current = setTimeout(() => {
          setLoading(false);
          setProgress(0);
          progressRef.current = 0;
          isNavigatingRef.current = false;
        }, 300);
      }, 200);
      return;
    }

    // If we were already navigating (from a click), complete it
    // Clear progress interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Complete and show for a moment before hiding
    setProgress(100);

    // Hide after a brief moment so users can see it completed
    completionTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setProgress(0);
      progressRef.current = 0;
      isNavigatingRef.current = false;
    }, 300);

    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, [pathname, startLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-transparent pointer-events-none">
      {loading && (
        <div
          className="h-full bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 transition-all duration-150 ease-linear"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 8px rgba(126, 34, 206, 0.7), 0 0 16px rgba(126, 34, 206, 0.5)',
          }}
        />
      )}
    </div>
  );
}

