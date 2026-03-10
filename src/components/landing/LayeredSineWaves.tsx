"use client";

import { useRef, useEffect } from "react";

// "The Way of Code" — stablecoin price walks
// Mean-reverting Ornstein-Uhlenbeck process per coin
// Trail fades left; live dot drifts vertically at the right edge

interface CoinWalk {
  label: string;
  r: number;
  g: number;
  b: number;
  prices: number[];
  vertOffset: number; // vertical separation from screen center
}

// Palette: darkest first (disappears first on scroll), main orange last (stays)
// #240900 → #531F01 → #873701 → #BE5103 → #FFA78F → #FFDED7 → #F88C05
const PALETTE: [number, number, number][] = [
  [36,  9,   0  ],  // #240900
  [83,  31,  1  ],  // #531F01
  [135, 55,  1  ],  // #873701
  [190, 81,  3  ],  // #BE5103
  [255, 167, 143],  // #FFA78F
  [255, 222, 215],  // #FFDED7
  [248, 140, 5  ],  // #F88C05 — main orange, last remaining
];

const COINS = Array.from({ length: 25 }, (_, i) => {
  const t   = (i / 24) * (PALETTE.length - 1); // 0 → 6
  const lo  = Math.floor(t);
  const hi  = Math.min(lo + 1, PALETTE.length - 1);
  const f   = t - lo;
  const [r1, g1, b1] = PALETTE[lo];
  const [r2, g2, b2] = PALETTE[hi];
  return {
    label: "",
    r: Math.round(r1 + (r2 - r1) * f),
    g: Math.round(g1 + (g2 - g1) * f),
    b: Math.round(b1 + (b2 - b1) * f),
    vertOffset: 0,
  };
});

const HISTORY = 1400; // price points retained (fills full canvas width + buffer)
const STEPS_PER_FRAME = 2; // advance per frame → faster horizontal scroll
const THETA   = 0.022; // mean-reversion speed
const SIGMA   = 1.8;   // noise amplitude (pixels per tick)
const MAX_DEV = 160;   // max y deviation from center (px)

function boxMuller() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const LayeredSineWaves = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cvs = canvas as HTMLCanvasElement;
    const c   = ctx   as CanvasRenderingContext2D;

    const resize = () => {
      cvs.width  = window.innerWidth;
      cvs.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Init walks — all deviations start at 0
    const walks: CoinWalk[] = COINS.map(coin => ({
      ...coin,
      prices: new Array<number>(HISTORY).fill(0),
    }));

    // Pre-run walk to fill history with realistic prices before first frame
    for (let i = 0; i < HISTORY; i++) {
      for (const w of walks) {
        const last = w.prices[w.prices.length - 1];
        const next = Math.max(
          -MAX_DEV,
          Math.min(MAX_DEV, last + -THETA * last + SIGMA * boxMuller())
        );
        w.prices.push(next);
        if (w.prices.length > HISTORY) w.prices.shift();
      }
    }

    let animId: number | null = null;

    // As progress → 1: sigma → 0 (no noise), theta → 1 (instant snap to 0)
    function tick(progress: number) {
      const effectiveSigma = SIGMA * (1 - progress);
      const effectiveTheta = THETA + (1 - THETA) * progress;
      for (const w of walks) {
        const last = w.prices[w.prices.length - 1];
        const next = Math.max(
          -MAX_DEV,
          Math.min(MAX_DEV, last + -effectiveTheta * last + effectiveSigma * boxMuller())
        );
        w.prices.push(next);
        if (w.prices.length > HISTORY) w.prices.shift();
      }
    }

    function drawSmooth(
      points: { x: number; y: number }[],
      r: number, g: number, b: number,
      W: number,
      alphaMult: number,
    ) {
      const passes = [
        { width: 14, alphaMax: 0.018 * alphaMult },
        { width: 4,  alphaMax: 0.10  * alphaMult },
        { width: 1,  alphaMax: 0.80  * alphaMult },
      ];
      for (const pass of passes) {
        const grad = c.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0,    `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.35, `rgba(${r},${g},${b},${pass.alphaMax * 0.05})`);
        grad.addColorStop(0.72, `rgba(${r},${g},${b},${pass.alphaMax * 0.35})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},${pass.alphaMax})`);
        c.beginPath();
        c.strokeStyle = grad;
        c.lineWidth   = pass.width;
        c.lineJoin    = "round";
        c.lineCap     = "round";
        c.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          c.lineTo(points[i].x, points[i].y);
        }
        c.stroke();
      }
    }

    function draw() {
      const W  = cvs.width;
      const H  = cvs.height;
      const cy = H / 2;

      // Scroll convergence: 0 = all 25 lines, 1 = 1 line
      const progress = Math.min(1, window.scrollY / (H * 0.75));
      const N = walks.length - 1; // 24

      // --- Background ---
      c.fillStyle = "#faf8f5";
      c.fillRect(0, 0, W, H);

      // Horizon line — very faint equilibrium
      c.beginPath();
      c.strokeStyle = "rgba(0,0,0,0.04)";
      c.lineWidth = 1;
      c.moveTo(0, cy);
      c.lineTo(W, cy);
      c.stroke();

      for (let s = 0; s < STEPS_PER_FRAME; s++) tick(progress);
      const xOf = (i: number) => (i / (HISTORY - 1)) * W;

      for (let wi = 0; wi < walks.length; wi++) {
        const lineAlpha = Math.min(1, Math.max(0, wi - N * progress + 1));
        if (lineAlpha < 0.01) continue;

        const { r, g, b, prices } = walks[wi];
        const n = prices.length;
        const EMA_A = 0.06;
        let ema = prices[0];
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < n; i++) {
          ema = EMA_A * prices[i] + (1 - EMA_A) * ema;
          if (i % 5 === 0) pts.push({ x: xOf(i), y: cy + ema });
        }
        pts.push({ x: xOf(n - 1), y: cy + ema });

        drawSmooth(pts, r, g, b, W, lineAlpha);

        const hx = xOf(n - 1);
        const hy = cy + prices[n - 1];
        c.fillStyle = `rgba(${r},${g},${b},${0.95 * lineAlpha})`;
        c.beginPath();
        c.arc(hx, hy, 2.2, 0, Math.PI * 2);
        c.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default LayeredSineWaves;
