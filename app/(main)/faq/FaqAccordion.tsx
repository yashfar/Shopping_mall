"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

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
    <div className="space-y-5">
      <div className="space-y-2.5">
        {paginated.map((faq, index) => {
          const isOpen = openId === faq.id;
          const questionId = `faq-question-${faq.id}`;
          const answerId = `faq-answer-${faq.id}`;
          const itemNumber = (page - 1) * PAGE_SIZE + index + 1;

          return (
            <article
              key={faq.id}
              className={`overflow-hidden rounded-2xl border bg-card shadow-[0_12px_35px_-30px_rgba(71,51,35,0.38)] transition-[border-color,box-shadow] duration-200 ${
                isOpen
                  ? "border-primary/25 shadow-[0_16px_40px_-30px_rgba(200,16,46,0.32)]"
                  : "border-border/40 hover:border-border/70"
              }`}
            >
              <h2>
                <button
                  id={questionId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="group flex min-h-16 w-full items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35 sm:min-h-[4.5rem] sm:gap-4 sm:px-5 sm:py-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-sm font-black tabular-nums text-primary sm:size-11 sm:text-[15px]">
                    {String(itemNumber).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 text-base font-bold leading-snug tracking-[-0.015em] text-foreground sm:text-[17px]">
                    {faq.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
                      isOpen
                        ? "border-primary/20 bg-primary text-primary-foreground"
                        : "border-border/40 bg-background text-foreground/70 group-hover:border-border/70 group-hover:text-primary"
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="size-4" strokeWidth={2} />
                    ) : (
                      <Plus className="size-4" strokeWidth={2} />
                    )}
                  </span>
                </button>
              </h2>

              <div
                id={answerId}
                role="region"
                aria-labelledby={questionId}
                aria-hidden={!isOpen}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-border/30 bg-muted/20 px-4 py-4 text-sm leading-6 text-muted-foreground sm:px-5 sm:text-[15px] sm:leading-7">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label={t("paginationLabel")}
          className="flex min-w-0 items-center justify-center gap-1.5 pt-1 sm:gap-3"
        >
          <button
            type="button"
            aria-label={t("previous")}
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex size-11 min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-card p-0 text-sm font-semibold text-foreground/75 transition-colors hover:border-border/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto sm:px-4"
          >
            <ChevronLeft
              className="size-4"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="sr-only sm:not-sr-only">{t("previous")}</span>
          </button>

          <div className="flex min-w-0 items-center justify-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  aria-label={t("pageLabel", { page: pageNumber })}
                  aria-current={pageNumber === page ? "page" : undefined}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`size-10 rounded-xl text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 ${
                    pageNumber === page
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border/40 bg-card text-foreground/65 hover:border-border/70 hover:text-foreground"
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            aria-label={t("next")}
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex size-11 min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-card p-0 text-sm font-semibold text-foreground/75 transition-colors hover:border-border/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto sm:px-4"
          >
            <span className="sr-only sm:not-sr-only">{t("next")}</span>
            <ChevronRight
              className="size-4"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </nav>
      )}
    </div>
  );
}
