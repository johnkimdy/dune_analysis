"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { lang, setLang } = useI18n();

  return (
    <div>
      <button
        onClick={() => setLang(lang === "en" ? "kr" : "en")}
        className={cn(
          "px-3 py-1.5 rounded-lg backdrop-blur-sm border text-xs font-medium tracking-wide transition-all duration-200",
          variant === "dark"
            ? "bg-white/10 border-white/20 hover:bg-white/20 hover:border-cyan-400/50"
            : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--border-muted)] hover:border-[var(--accent)]/50"
        )}
      >
        <span
          className={
            variant === "dark"
              ? lang === "en"
                ? "text-white"
                : "text-zinc-500"
              : lang === "en"
                ? "text-[var(--primary)]"
                : "text-[var(--muted)]"
          }
        >
          EN
        </span>
        <span
          className={
            variant === "dark" ? "text-zinc-600 mx-1" : "text-[var(--muted)] mx-1"
          }
        >
          /
        </span>
        <span
          className={
            variant === "dark"
              ? lang === "kr"
                ? "text-white"
                : "text-zinc-500"
              : lang === "kr"
                ? "text-[var(--primary)]"
                : "text-[var(--muted)]"
          }
        >
          KR
        </span>
      </button>
    </div>
  );
}
