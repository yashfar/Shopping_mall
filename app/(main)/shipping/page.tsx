import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Headphones, PhoneCall, Send, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("shippingPolicy");

    return {
        title: `${t("title")} | Creative Aventus`,
        description: t("metaDescription"),
        alternates: { canonical: "/shipping" },
    };
}

export default async function ShippingPage() {
    const t = await getTranslations("shippingPolicy");
    const sections = [
        { title: t("s1Title"), body: t("s1Body") },
        { title: t("s2Title"), body: t("s2Body") },
        { title: t("s3Title"), body: t("s3Body") },
        { title: t("s4Title"), body: t("s4Body") },
        { title: t("s5Title"), body: t("s5Body") },
    ];

    return (
        <main className="bg-[#fbfaf7] px-4 py-6 sm:px-6 sm:py-8 lg:py-12">
            <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
                <nav aria-label={t("breadcrumbLabel")} className="flex items-center gap-2 px-1 text-sm font-medium text-muted-foreground">
                    <Link
                        href="/"
                        className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                        {t("breadcrumbHome")}
                    </Link>
                    <span aria-hidden="true" className="text-border">/</span>
                    <span aria-current="page" className="truncate text-foreground/70">{t("breadcrumbCurrent")}</span>
                </nav>

                <section className="relative isolate min-h-[260px] overflow-hidden rounded-[1.75rem] bg-[#f1e2d2] shadow-[0_24px_70px_-48px_rgba(78,53,35,0.5)] ring-1 ring-black/[0.04] sm:min-h-[290px] md:min-h-[315px] lg:min-h-[340px] lg:rounded-[2rem]">
                    <Image
                        src="/images/shipping/shipping-hero.png"
                        alt=""
                        fill
                        priority
                        sizes="(max-width: 767px) 100vw, 1280px"
                        className="object-cover object-right sm:object-center"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,246,239,0.99)_0%,rgba(251,246,239,0.97)_42%,rgba(251,246,239,0.78)_55%,rgba(251,246,239,0.26)_70%,rgba(251,246,239,0)_86%)] sm:bg-[linear-gradient(90deg,rgba(251,246,239,0.99)_0%,rgba(251,246,239,0.95)_38%,rgba(251,246,239,0.58)_58%,rgba(251,246,239,0)_78%)]" />
                    <div className="relative z-10 flex min-h-[260px] max-w-[79%] flex-col justify-center px-5 py-7 sm:min-h-[290px] sm:max-w-[68%] sm:px-8 md:min-h-[315px] md:max-w-[62%] md:px-10 lg:min-h-[340px] lg:max-w-[60%] lg:px-14">
                        <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white/75 text-primary shadow-sm ring-1 ring-black/[0.04] backdrop-blur-sm sm:size-12">
                            <Truck className="size-5 sm:size-[1.35rem]" strokeWidth={1.8} aria-hidden="true" />
                        </span>
                        <h1 className="text-[32px] font-black leading-[1.04] tracking-[-0.04em] text-foreground sm:text-[38px] md:text-[44px] lg:text-[48px]">
                            {t("title")}
                        </h1>
                        <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-foreground/65 sm:text-base sm:leading-7 md:text-lg">
                            {t("subtitle")}
                        </p>
                    </div>
                </section>

                <div className="space-y-3">
                    {sections.map((section, index) => (
                        <section
                            key={section.title}
                            className="rounded-2xl border border-border/35 bg-card p-4 shadow-[0_12px_32px_-30px_rgba(71,51,35,0.3)] transition-colors hover:border-border/60 sm:p-5 lg:px-6 lg:py-5"
                        >
                            <div className="flex items-start gap-4 sm:gap-5">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-sm font-black tabular-nums text-primary sm:size-11 sm:text-[15px]">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div className="min-w-0 pt-0.5 sm:pt-1">
                                    <h2 className="text-[17px] font-bold leading-snug tracking-[-0.015em] text-foreground sm:text-lg md:text-xl">
                                        {section.title.replace(/^\d+\.\s*/, "")}
                                    </h2>
                                    <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-muted-foreground sm:mt-2 sm:text-[15px] sm:leading-7 md:text-base">
                                        {section.body}
                                    </p>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                <section className="overflow-hidden rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-[#fff7f4] via-[#fcebe7] to-[#f7dfda] p-5 shadow-[0_16px_44px_-42px_rgba(95,47,40,0.32)] sm:p-7 lg:p-9">
                    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)] md:gap-8 lg:gap-12">
                        <div className="flex flex-col items-start gap-4 md:flex-row">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-sm ring-1 ring-black/[0.04]">
                                <Headphones className="size-5" strokeWidth={1.8} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-xl font-black tracking-[-0.025em] text-foreground sm:text-2xl">
                                    {t("personalizedContactTitle")}
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/65 sm:text-[15px] sm:leading-7">
                                    {t("personalizedContactBody")}
                                </p>
                            </div>
                        </div>

                        <div className="flex w-full flex-col gap-3 md:max-w-[18rem] md:justify-self-end lg:max-w-[19rem]">
                            <a
                                href="mailto:yasarfarhadi@gmail.com"
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <Send className="size-4" strokeWidth={1.8} aria-hidden="true" />
                                {t("emailCta")}
                            </a>
                            <a
                                href="tel:+905510827215"
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-white/75 px-4 py-3 text-center text-sm font-bold text-primary transition-colors hover:border-primary/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <PhoneCall className="size-4" strokeWidth={1.8} aria-hidden="true" />
                                {t("phoneCta")}
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
