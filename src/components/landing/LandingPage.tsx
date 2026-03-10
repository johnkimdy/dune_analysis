"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import LayeredSineWaves from "./LayeredSineWaves";
import { AnimatedLandingTitle } from "./AnimatedLandingTitle";

/* Match dashboard/charts - dune yellowish white scheme */
const COLORS = {
  background: "#faf8f5",
  card: "#ffffff",
  border: "#e5e5e5",
  borderMuted: "#d4d4d4",
  primary: "#0f0f12",
  secondary: "#52525b",
  muted: "#6e6e72",
  accent: "#f26b3a",
};

const BENTO_CARD =
  "relative rounded-xl border backdrop-blur-[10px] p-6 md:p-8 shadow-sm";

export function LandingPage() {
  const heroSpacerRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top when navigating back to home so slogan reappears
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen" style={{ color: COLORS.primary }}>
      {/* Full-screen background animation */}
      <div className="fixed inset-0 w-full h-full z-0">
        <LayeredSineWaves />
      </div>

      {/* Animated title: starts as hero headline, shrinks into navbar on scroll */}
      <AnimatedLandingTitle heroRef={heroSpacerRef} />

      {/* Page content above animation - blur-in on load */}
      <div className="relative z-10 min-h-screen animate-chart-blur-in">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 md:pt-28 md:pb-32">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${COLORS.accent}22, transparent)`,
          }}
        />
        <div className="relative max-w-4xl mr-auto text-left">
          {/* Spacer for layout — animated title overlays this area */}
          <div
            ref={heroSpacerRef}
            className="font-bold text-6xl md:text-8xl lg:text-9xl tracking-tight leading-[0.95] opacity-0 select-none"
            style={{ color: COLORS.primary }}
            aria-hidden="true"
          >
            The Stablecoin
            <br />
            <span style={{ color: COLORS.accent }}>Must Flow.</span>
          </div>
          <p className="mt-6 text-lg md:text-xl lg:text-2xl max-w-2xl leading-relaxed" style={{ color: COLORS.secondary }}>
            Real-time macro-intelligence for the shadow FX market. We quantify
            the velocity of global capital flight, mapping the displacement of
            traditional rails by the stablecoin standard. Our signals are built
            to inform policy—and potentially stabilize national currencies (KRW, JPY, EUR, etc.)—before the shortage.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block font-medium underline decoration-current underline-offset-4 transition-opacity hover:opacity-80"
            style={{ color: COLORS.accent }}
          >
            Enter the Dashboard →
          </Link>
        </div>
      </section>

      {/* Live Signal Gauge */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          <div
            className={cn(BENTO_CARD, "relative overflow-hidden")}
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.border,
            }}
          >
            <div
              className="absolute inset-0 opacity-15"
              style={{
                background: `radial-gradient(ellipse 60% 40% at 50% 100%, ${COLORS.accent}40, transparent)`,
              }}
            />
            <div className="relative text-center py-8">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: COLORS.muted }}>
                Current Systemic Stress
              </p>
              <p
                className="text-4xl md:text-5xl font-bold tabular-nums animate-pulse"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), var(--font-geist-mono)",
                  color: COLORS.accent,
                }}
              >
                42.8%
              </p>
              <p className="mt-2 text-sm font-medium" style={{ color: COLORS.accent }}>
                STABLE / NEUTRAL
              </p>
              <p className="mt-6 text-xs max-w-md mx-auto leading-relaxed" style={{ color: COLORS.muted }}>
                Our LightGBM model has processed 4,200+ on-chain events in the
                last 24 hours. No significant capital flight detected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars - Bento Grid */}
      <section className="px-4 pb-24 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* I. Beyond the Peg */}
            <div className={BENTO_CARD} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: COLORS.accent }}>
                I
              </p>
              <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.primary }}>Beyond the Peg</h2>
              <p className="text-xs uppercase tracking-wider mb-4" style={{ color: COLORS.muted }}>
                The Diagnostic
              </p>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.secondary }}>
                Most see stablecoins as a store of value. We see them as a{" "}
                <span style={{ color: COLORS.primary }}>Sovereign Signal</span>. By
                indexing on-chain velocity against $KRW/USD$ volatility, we
                detect the cracks in the traditional fiat architecture before
                the central banks do.
              </p>
            </div>

            {/* II. KFI */}
            <div className={BENTO_CARD} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: COLORS.accent }}>
                II
              </p>
              <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.primary }}>
                The Kimchi Flight Index <span className="font-mono" style={{ color: COLORS.accent }}>(KFI)</span>
              </h2>
              <p className="text-xs uppercase tracking-wider mb-4" style={{ color: COLORS.muted }}>
                The Proprietary Alpha
              </p>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.secondary }}>
                Our LightGBM-powered engine monitors the Net Momentum ($M$) of
                local on-ramps. When stablecoin velocity spikes on the
                Peninsula, our models predict currency devaluation with
                institutional-grade precision.
              </p>
            </div>

            {/* III. SAM */}
            <div className={BENTO_CARD} style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: COLORS.accent }}>
                III
              </p>
              <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.primary }}>
                The Stablecoin Adoption Multiplier <span className="font-mono" style={{ color: COLORS.accent }}>(SAM)</span>
              </h2>
              <p className="text-xs uppercase tracking-wider mb-4" style={{ color: COLORS.muted }}>
                The Displacement Engine
              </p>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.secondary }}>
                We track the SAM Index—a real-time ratio of on-chain settlement
                volume versus legacy SWIFT corridors. Watch the tectonic shift
                as $USDT$ and $USDC$ displace T+2 settlement layers in the SE
                Asian trade corridor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data-as-Code Footer */}
      <footer className="border-t px-4 py-12 md:py-16" style={{ borderColor: COLORS.border }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg font-bold mb-2" style={{ color: COLORS.primary }}>
            Proprietary Data. Open Infrastructure.
          </p>
          <p className="text-sm mb-8 max-w-xl mx-auto" style={{ color: COLORS.muted }}>
            All indices are calculated via Python/LightGBM, cached on GCP, and
            delivered via our High-Fidelity API.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm">
            <Link
              href="/dashboard"
              className="font-mono transition-colors hover:opacity-80"
              style={{ color: COLORS.accent }}
            >
              Explore the Dashboard
            </Link>
            <span className="hidden sm:inline" style={{ color: COLORS.muted }}>|</span>
            <Link
              href="/charts"
              className="font-mono transition-colors hover:opacity-80"
              style={{ color: COLORS.accent }}
            >
              View All Charts
            </Link>
            <span className="hidden sm:inline" style={{ color: COLORS.muted }}>|</span>
            <a
              href="https://dune.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono transition-colors hover:opacity-80"
              style={{ color: COLORS.accent }}
            >
              Dune Source
            </a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
