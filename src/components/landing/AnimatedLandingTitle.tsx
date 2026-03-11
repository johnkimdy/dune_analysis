"use client";

import { useState, useEffect, useRef } from "react";
import { useLandingScroll } from "@/contexts/LandingScrollContext";

const FALLBACK_SCROLL_RANGE = 520;
const COLORS = { primary: "#0f0f12", accent: "#f26b3a" };

// Pop order: from start of "The Stablecoin Must Flow." — letters leave slogan, stack in navbar
const FULL_TEXT = "The Stablecoin Must Flow.";
const ORANGE_START = 15; // "Must Flow." (M,U,S,T, ,F,L,O,W,.) = orange, rest = black

interface AnimatedLandingTitleProps {
  heroRef: React.RefObject<HTMLDivElement | null>;
  paragraphRef: React.RefObject<HTMLParagraphElement | null>;
}

/** Hero slogan: fixated above paragraph, scrolls with content, shrinks and pops letters into navbar. */
export function AnimatedLandingTitle({ heroRef, paragraphRef }: AnimatedLandingTitleProps) {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const rangeSetRef = useRef(false);
  const { setScrollRange } = useLandingScroll() ?? { setScrollRange: () => {} };

  useEffect(() => {
    setMounted(true);
    const measure = () => {
      if (heroRef?.current && paragraphRef?.current && !rangeSetRef.current && window.scrollY < 50) {
        const paraR = paragraphRef.current.getBoundingClientRect();
        const nav = document.querySelector("nav");
        const navbarBottom = nav ? nav.getBoundingClientRect().bottom : 64;
        // Scroll range = scroll distance at which paragraph meets navbar
        const range = Math.max(1, paraR.top - navbarBottom);
        setScrollRange(range);
        rangeSetRef.current = true;
      }
    };
    const onScroll = () => {
      setScrollY(window.scrollY);
      measure();
    };
    onScroll();
    const t = setTimeout(measure, 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [heroRef, paragraphRef, setScrollRange]);

  const { scrollRange } = useLandingScroll() ?? {};
  const effectiveScrollRange = scrollRange ?? FALLBACK_SCROLL_RANGE;

  if (!mounted) return null;

  const progress = Math.min(scrollY / effectiveScrollRange, 1);
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
  const lineHeight = 0.95;

  if (remaining.length === 0) return null;

  // Shrink by scroll progress; title sits at bottom of spacer (above paragraph)
  const sloganFontSize = Math.round(sizeStart + (sizeEnd - sizeStart) * progress);

  // Black = "The Stablecoin ", Orange = "Must Flow." (M,U,S,T, ,F,L,O,W,. only)
  const orangeStartInRemaining = Math.max(0, ORANGE_START - popCount);
  const part1 = remaining.slice(0, orangeStartInRemaining); // black
  const part2 = remaining.slice(orangeStartInRemaining);    // orange

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 font-bold tracking-tight pointer-events-none"
      style={{
        fontSize: `${sloganFontSize}px`,
        lineHeight,
      }}
    >
      {part1 ? <span style={{ color: COLORS.primary }}>{part1}</span> : null}
      {part1 && part2 ? <br /> : null}
      {part2 ? <span style={{ color: COLORS.accent }}>{part2}</span> : null}
    </div>
  );
}
