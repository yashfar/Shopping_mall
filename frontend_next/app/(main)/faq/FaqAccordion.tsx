"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const PAGE_SIZE = 5;

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const t = useTranslations("faq");
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(faqs.length / PAGE_SIZE);
  const paginated = faqs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setOpenId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {paginated.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`bg-white rounded-2xl border transition-all duration-200 ${
                isOpen
                  ? "border-[#C8102E]/30 shadow-[0_4px_20px_rgba(200,16,46,0.08)]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span
                  className={`text-base font-semibold leading-snug transition-colors ${isOpen ? "text-[#C8102E]" : "text-[#1A1A1A]"}`}
                >
                  {faq.question}
                </span>
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isOpen
                      ? "bg-[#C8102E] text-white rotate-45"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                <p className="px-6 pb-5 text-[#A9A9A9] leading-relaxed text-sm md:text-base">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            {t("previous")}
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                  p === page
                    ? "bg-[#C8102E] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {t("next")}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
