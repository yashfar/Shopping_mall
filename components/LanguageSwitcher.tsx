"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  };

  if (compact) {
    return (
      <button
        onClick={() => switchLocale(locale === "en" ? "tr" : "en")}
        disabled={isPending}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#1A1A1A] transition-all duration-200 hover:bg-[rgba(200,16,46,0.05)] hover:text-[#C8102E] border border-transparent hover:border-[rgba(200,16,46,0.1)] disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
        <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-black bg-white rounded-full w-4 h-4 flex items-center justify-center border border-gray-200 text-[#1A1A1A] shadow-sm leading-none">
          {locale === "en" ? "TR" : "EN"}
        </span>
      </button>
    );
  }

  return (
    <div className={`relative flex items-center bg-[#F3F3F3] rounded-full p-[3px] transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Sliding pill background */}
      <div
        className="absolute top-[3px] h-[calc(100%-6px)] w-[calc(50%-3px)] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ left: locale === "en" ? "3px" : "calc(50%)" }}
      />

      <button
        onClick={() => switchLocale("en")}
        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.8rem] font-bold transition-colors duration-300 ${
          locale === "en"
            ? "text-[#1A1A1A]"
            : "text-[#A9A9A9] hover:text-[#666]"
        }`}
      >
        <span className="text-sm leading-none">EN</span>
      </button>

      <button
        onClick={() => switchLocale("tr")}
        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.8rem] font-bold transition-colors duration-300 ${
          locale === "tr"
            ? "text-[#1A1A1A]"
            : "text-[#A9A9A9] hover:text-[#666]"
        }`}
      >
        <span className="text-sm leading-none">TR</span>
      </button>
    </div>
  );
}
