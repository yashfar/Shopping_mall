import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronRight, CircleAlert, List } from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  wide?: boolean;
}

interface LegalPolicyPageProps {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  heroImage: string;
  heroAlt: string;
  heroIcon: LucideIcon;
  homeLabel: string;
  legalLabel: string;
  contentsLabel: string;
  sections: LegalSection[];
  notice?: { title: string; body: string };
}

function getTitleParts(title: string, fallbackNumber: number) {
  const match = title.match(/^(\d+)[.)]?\s*(.*)$/);

  return {
    number: match?.[1] ?? String(fallbackNumber),
    label: match?.[2] || title,
  };
}

export default function LegalPolicyPage({
  title,
  subtitle,
  lastUpdated,
  heroImage,
  heroAlt,
  heroIcon: HeroIcon,
  homeLabel,
  legalLabel,
  contentsLabel,
  sections,
  notice,
}: LegalPolicyPageProps) {
  const normalizedSections = sections.map((section, index) => ({
    ...section,
    ...getTitleParts(section.title, index + 1),
  }));

  return (
    <div className="bg-[#fbfaf7]">
      <div className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-5 sm:py-7 lg:px-8 lg:py-9">
        <nav aria-label={legalLabel} className="mb-3 px-1 sm:mb-4">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <li>
              <Link
                href="/"
                className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {homeLabel}
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">
              /
            </li>
            <li>{legalLabel}</li>
            <li aria-hidden="true" className="text-border">
              /
            </li>
            <li aria-current="page" className="text-foreground">
              {title}
            </li>
          </ol>
        </nav>

        <header className="relative isolate min-h-[300px] overflow-hidden rounded-[1.75rem] border border-black/[0.04] bg-[#f6efe5] shadow-[0_16px_50px_-36px_rgba(68,49,31,0.45)] sm:min-h-[330px] lg:min-h-[350px]">
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1440px"
            className="object-cover object-[68%_center] sm:object-[66%_center] lg:object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,247,0.99)_0%,rgba(255,252,247,0.96)_38%,rgba(255,252,247,0.78)_56%,rgba(255,252,247,0.12)_82%)] sm:bg-[linear-gradient(90deg,rgba(255,252,247,0.99)_0%,rgba(255,252,247,0.95)_36%,rgba(255,252,247,0.7)_55%,rgba(255,252,247,0.05)_78%)]"
          />
          <div className="relative z-10 flex min-h-[300px] max-w-[78%] flex-col justify-center px-5 py-7 sm:min-h-[330px] sm:max-w-[64%] sm:px-8 lg:min-h-[350px] lg:max-w-[58%] lg:px-12">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-primary shadow-sm backdrop-blur-sm sm:size-14">
              <HeroIcon
                aria-hidden="true"
                className="size-6 sm:size-7"
                strokeWidth={1.8}
              />
            </div>
            <h1 className="max-w-2xl text-[clamp(2rem,4.3vw,3rem)] font-black leading-[1.02] tracking-[-0.045em] text-foreground">
              {title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 lg:text-lg">
              {subtitle}
            </p>
            {lastUpdated ? (
              <p className="mt-3 text-xs font-medium text-muted-foreground/90 sm:text-sm">
                {lastUpdated}
              </p>
            ) : null}
          </div>
        </header>

        {notice ? (
          <aside className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50/90 p-4 text-amber-950 shadow-[0_12px_35px_-30px_rgba(120,78,10,0.5)] sm:p-5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm">
              <CircleAlert
                aria-hidden="true"
                className="size-5"
                strokeWidth={2}
              />
            </span>
            <div>
              <h2 className="font-bold tracking-tight">{notice.title}</h2>
              <p className="mt-1 text-sm leading-6 text-amber-950/75">
                {notice.body}
              </p>
            </div>
          </aside>
        ) : null}

        <nav aria-label={contentsLabel} className="mt-4">
          <details className="group overflow-hidden rounded-2xl border border-primary/10 bg-primary/[0.035] shadow-sm lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <List aria-hidden="true" className="size-5 text-primary" />
              <span className="flex-1">{contentsLabel}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 text-primary transition-transform group-open:rotate-180"
              />
            </summary>
            <ol className="grid gap-1 border-t border-primary/10 p-2">
              {normalizedSections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-xs font-bold text-primary">
                      {section.number}
                    </span>
                    <span>{section.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </details>

          <div className="sticky top-20 z-20 hidden overflow-x-auto rounded-2xl border border-primary/10 bg-[#fffafa]/95 shadow-[0_12px_35px_-30px_rgba(65,38,38,0.45)] backdrop-blur-md lg:block">
            <div className="flex min-w-max items-center gap-2 px-4 py-3">
              <div className="mr-1 flex items-center gap-2 pr-3 font-semibold text-foreground">
                <List aria-hidden="true" className="size-5 text-primary" />
                <span>{contentsLabel}</span>
              </div>
              {normalizedSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full px-2.5 text-sm text-muted-foreground transition-colors hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-6 items-center justify-center rounded-full border border-primary/10 bg-white text-xs font-bold text-primary">
                    {section.number}
                  </span>
                  <span>{section.label}</span>
                </a>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4">
          {normalizedSections.map((section) => {
            const SectionIcon = section.icon;

            return (
              <section
                id={section.id}
                key={section.id}
                className={`scroll-mt-28 rounded-2xl border border-black/[0.055] bg-white/90 p-5 shadow-[0_14px_45px_-36px_rgba(57,42,28,0.55)] sm:p-6 ${section.wide ? "md:col-span-2" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.065] text-primary sm:size-14 hidden">
                    <SectionIcon
                      aria-hidden="true"
                      className="size-6 sm:size-7"
                      strokeWidth={1.8}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/[0.07] text-xs font-bold text-primary">
                        {section.number}
                      </span>
                      <h2 className="text-lg font-bold leading-6 tracking-[-0.02em] text-foreground sm:text-xl">
                        {section.label}
                      </h2>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground sm:text-[0.95rem] sm:leading-7">
                      {section.body}
                    </p>
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    className="mt-1 hidden size-4 shrink-0 text-primary/65 sm:block"
                  />
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
