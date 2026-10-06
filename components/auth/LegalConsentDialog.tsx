"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface LegalDialogSection {
  title: string;
  body: string;
}

interface LegalConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  lastUpdated?: string;
  closeLabel: string;
  sections: LegalDialogSection[];
}

export default function LegalConsentDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  lastUpdated,
  closeLabel,
  sections,
}: LegalConsentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="legal-dialog-title"
      aria-describedby="legal-dialog-description"
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
      className="m-auto max-h-[85svh] w-[calc(100%_-_2rem)] max-w-3xl overflow-hidden rounded-[22px] border border-[#eadfce] bg-[#fffdfa] p-0 text-[#1b1815] shadow-[0_30px_90px_-34px_rgba(34,24,16,0.6)] backdrop:bg-[#201a15]/40"
    >
      <div className="flex max-h-[85svh] flex-col">
        <header className="flex items-start gap-4 border-b border-[#eee3d4] bg-[#fffaf3] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0 flex-1">
            <h2 id="legal-dialog-title" className="text-xl font-bold tracking-tight sm:text-2xl">
              {title}
            </h2>
            <p id="legal-dialog-description" className="mt-1 text-sm leading-6 text-[#71675d]">
              {subtitle}
            </p>
            {lastUpdated ? <p className="mt-1 text-xs font-medium text-[#8a7d70]">{lastUpdated}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#6c6258] transition-colors hover:bg-[#f1e7da] hover:text-[#1b1815] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="space-y-5">
            {sections.map((section, index) => (
              <section key={`${section.title}-${index}`}>
                <h3 className="font-semibold text-[#211d19]">{section.title}</h3>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-[#6f655b]">{section.body}</p>
              </section>
            ))}
          </div>
        </div>

        <footer className="border-t border-[#eee3d4] bg-[#fffaf3] px-5 py-4 text-right sm:px-7">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
          >
            {closeLabel}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
