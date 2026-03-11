"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLandingScroll } from "@/contexts/LandingScrollContext";

const SCROLL_SHRINK_THRESHOLD = 32;
const LANDING_SCROLL_RANGE_FALLBACK = 520;
const LANDING_FULL_TEXT = "The Stablecoin Must Flow.";
const LANDING_STACKED_BLACK_LEN = 13; // "thestablecoin"
const ACCENT = "#f26b3a";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/charts", label: "Charts" },
] as const;

/** On landing: navbar title builds letter-by-letter from scroll (lowercase, no spaces) */
function LandingNavTitle({ scrollY, scrollRange }: { scrollY: number; scrollRange: number }) {
  const progress = Math.min(scrollY / scrollRange, 1);
  const popPhaseEnd = 0.88;
  const popProgress = Math.min(progress / popPhaseEnd, 1);
  const popCount = Math.floor(popProgress * (LANDING_FULL_TEXT.length + 1));
  const popped = LANDING_FULL_TEXT.slice(0, Math.min(popCount, LANDING_FULL_TEXT.length));
  const stacked = Array.from(popped)
    .filter((c) => c !== " ")
    .join("")
    .toLowerCase();
  const black = stacked.slice(0, LANDING_STACKED_BLACK_LEN);
  const orange = stacked.slice(LANDING_STACKED_BLACK_LEN);

  return (
    <>
      <span className="text-[var(--primary)]">{black}</span>
      <span style={{ color: ACCENT }}>{orange}</span>
    </>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { scrollRange } = useLandingScroll() ?? {};
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_SHRINK_THRESHOLD);
      if (pathname === "/") setScrollY(window.scrollY);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <nav
      className={cn(
        "sticky top-0 z-30 transition-all duration-200",
        scrolled ? "border-b border-transparent" : "border-b border-[var(--border)]"
      )}
      style={
        scrolled
          ? {
              backgroundColor: "rgba(250,248,245,0.2)",
              WebkitBackdropFilter: "blur(12px)",
              backdropFilter: "blur(12px)",
            }
          : { backgroundColor: "#faf8f5" }
      }
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
        <div
          className={cn(
            "flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 transition-all duration-200",
            scrolled ? "py-2 md:py-2" : "py-3 md:py-4"
          )}
        >
          {/* Left: navbar title + tabs (on landing, title builds letter-by-letter from scroll) */}
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 min-w-0">
            {pathname === "/" ? (
              <Link
                href="/"
                className={cn(
                  "font-bold tracking-tight flex-shrink-0 min-w-0",
                  "text-lg md:text-xl"
                )}
              >
                <LandingNavTitle scrollY={scrollY} scrollRange={scrollRange ?? LANDING_SCROLL_RANGE_FALLBACK} />
              </Link>
            ) : (
            <Link
              href="/"
              className={cn(
                "font-bold transition-all duration-200 flex-shrink-0",
                scrolled ? "text-lg md:text-xl" : "text-2xl md:text-3xl"
              )}
            >
              <span className="text-[var(--primary)]">{t("dashboard.titlePart1")}</span>
              <span className="text-[var(--accent)]">{t("dashboard.titlePart2")}</span>
            </Link>
            )}
            <div className="flex gap-0.5 flex-shrink-0">
              {TABS.map(({ href, label }) => {
                const isActive =
                  href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "text-[var(--secondary)] hover:text-[var(--primary)] hover:bg-[var(--card)]"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
