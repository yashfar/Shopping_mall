"use client";

import { HeartHandshake, ShieldCheck, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AuthPageShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("authExperience");
  const benefits = [
    { icon: Truck, title: t("reliableShopping"), body: t("reliableShoppingBody") },
    { icon: ShieldCheck, title: t("securePayment"), body: t("securePaymentBody") },
    { icon: HeartHandshake, title: t("hereForYou"), body: t("hereForYouBody") },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-transparent">
      <div className="absolute inset-0 z-0 bg-[#fff8ee]/25 lg:bg-gradient-to-r lg:from-[#fff8ee]/45 lg:via-[#fff8ee]/10 lg:to-transparent" />

      <div className="relative z-10 mx-auto grid min-h-[640px] w-full max-w-[1400px] grid-cols-[minmax(0,1fr)] items-center px-4 py-6 sm:min-h-[680px] sm:px-6 sm:py-8 lg:min-h-[690px] lg:grid-cols-[minmax(0,1fr)_minmax(400px,450px)] lg:gap-12 lg:px-12 lg:py-10 xl:gap-20 xl:px-16">
        <aside className="hidden max-w-[520px] lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.42em] text-[#a36f37]">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3.5 whitespace-pre-line font-serif text-[clamp(3rem,3.6vw,3.4rem)] leading-[1.06] tracking-[-0.035em] text-[#161616]">
            {t("headline")}
          </h1>
          <div className="mt-4 h-px w-16 bg-[#b67b3f]" aria-hidden="true" />

          <div className="mt-7 space-y-4">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#ddc8aa]/70 bg-[#fffaf2]/65 text-[#60472d] shadow-sm">
                  <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.7} />
                </span>
                <div>
                  <h2 className="text-[0.94rem] font-semibold text-[#1d1a17]">{title}</h2>
                  <p className="mt-0.5 text-sm leading-5 text-[#685f56]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 w-full justify-center lg:justify-end">
          <div className="min-w-0 w-full max-w-[450px] rounded-[22px] border border-white/70 bg-[#fffdfa]/95 p-[18px] shadow-[0_24px_65px_-32px_rgba(79,55,33,0.5)] sm:p-7 lg:p-7">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
