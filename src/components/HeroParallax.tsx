"use client";

import { useEffect, useRef } from "react";

/** Subtle scroll-linked depth on logged-out hero (CSS transform; respects reduced motion). */
export function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 420);
        el.style.setProperty("--hero-shift", `${y}px`);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={ref} className="hero-parallax relative min-h-[320px] overflow-hidden sm:min-h-[400px]">
      {children}
    </section>
  );
}
