"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setLang(lang === "en" ? "kr" : "en")}
        className="px-3 py-1.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10
                   text-xs font-medium tracking-wide transition-all duration-200
                   hover:bg-white/10 hover:border-white/20"
      >
        <span className={lang === "en" ? "text-white" : "text-slate-500"}>
          EN
        </span>
        <span className="text-slate-600 mx-1">/</span>
        <span className={lang === "kr" ? "text-white" : "text-slate-500"}>
          KR
        </span>
      </button>
    </div>
  );
}
