"use client";

import { useState, useEffect } from "react";

const SCROLL_RANGE = 520;
const COLORS = { primary: "#0f0f12", accent: "#f26b3a" };

// Pop order: from start of "The Stablecoin Must Flow." — letters leave slogan, stack in navbar (NavBar renders that)
const FULL_TEXT = "The Stablecoin Must Flow.";
const LINE1_LEN = 14; // "The Stablecoin"

interface AnimatedLandingTitleProps {
  heroRef: React.RefObject<HTMLDivElement | null>;
}

/** Hero slogan only: stays fixed, shrinks, loses letters as they pop to navbar. NavBar renders the stacked title. */
export function AnimatedLandingTitle({ heroRef }: AnimatedLandingTitleProps) {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [heroPos, setHeroPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    const measureHero = () => {
      if (heroRef?.current && window.scrollY === 0) {
        const r = heroRef.current.getBoundingClientRect();
        setHeroPos({ top: r.top, left: r.left });
      }
    };
    const onScroll = () => setScrollY(window.scrollY);
    const onResize = () => {
      if (window.scrollY === 0) measureHero();
    };
    onScroll();
    onResize();
    const t = setTimeout(measureHero, 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [heroRef]);

  if (!mounted || !heroPos) return null;

  const progress = Math.min(scrollY / SCROLL_RANGE, 1);
  const popPhaseEnd = 0.88;
  const popProgress = Math.min(progress / popPhaseEnd, 1);
  const popCount = Math.floor(popProgress * (FULL_TEXT.length + 1));
  const remaining = FULL_TEXT.slice(popCount);

  const sizeStart =
    typeof window !== "undefined"
      ? window.innerWidth >= 1024
        ? 96
        : window.innerWidth >= 768
          ? 72
          : 60
      : 72;
  const sizeEnd = 12;
  const sloganFontSize = Math.round(sizeStart + (sizeEnd - sizeStart) * progress);

  if (remaining.length === 0) return null;

  return (
    <div
      className="fixed z-40 font-bold tracking-tight pointer-events-none"
      style={{
        top: `${heroPos.top}px`,
        left: `${heroPos.left}px`,
        fontSize: `${sloganFontSize}px`,
        lineHeight: 0.95,
      }}
    >
      <span style={{ color: COLORS.primary }}>{remaining.slice(0, LINE1_LEN)}</span>
      <br />
      <span style={{ color: COLORS.accent }}>{remaining.slice(LINE1_LEN)}</span>
    </div>
  );
}
