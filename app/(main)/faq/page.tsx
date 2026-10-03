import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import FaqAccordion from "./FaqAccordion";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("faq");

    return {
        title: `${t("title")} | Creative Aventus`,
        description: t("metaDescription"),
        alternates: { canonical: "/faq" },
    };
}

export default async function FaqPage() {
    const t = await getTranslations("faq");
    const locale = await getLocale();

    const faqs = await prisma.faq.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, question: true, questionEn: true, answer: true, answerEn: true },
    });

    const localizedFaqs = faqs.map((faq) => ({
        id: faq.id,
        question: locale === "en" && faq.questionEn ? faq.questionEn : faq.question,
        answer: locale === "en" && faq.answerEn ? faq.answerEn : faq.answer,
    }));

    const topics = [
        { title: t("topicOrdersTitle"), description: t("topicOrdersDescription") },
        { title: t("topicPaymentTitle"), description: t("topicPaymentDescription") },
        { title: t("topicReturnsTitle"), description: t("topicReturnsDescription") },
        { title: t("topicProductsTitle"), description: t("topicProductsDescription") },
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
                    <span aria-current="page" className="text-foreground/70">{t("breadcrumbCurrent")}</span>
                </nav>

                <section className="relative isolate min-h-[250px] overflow-hidden rounded-[1.75rem] bg-[#f3e5d6] shadow-[0_24px_70px_-48px_rgba(78,53,35,0.5)] ring-1 ring-black/[0.04] sm:min-h-[280px] md:min-h-[310px] lg:min-h-[330px] lg:rounded-[2rem]">
                    <Image
                        src="/images/faq/faq-hero.png"
                        alt=""
                        fill
                        priority
                        sizes="(max-width: 767px) 100vw, 1280px"
                        className="object-cover object-[75%_50%] sm:[object-position:76%_50%] lg:object-center"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,245,238,0.99)_0%,rgba(250,245,238,0.97)_42%,rgba(250,245,238,0.82)_52%,rgba(250,245,238,0.38)_65%,rgba(250,245,238,0.06)_78%,rgba(250,245,238,0)_86%)] sm:bg-[linear-gradient(90deg,rgba(250,245,238,0.99)_0%,rgba(250,245,238,0.95)_38%,rgba(250,245,238,0.58)_58%,rgba(250,245,238,0)_78%)]" />
                    <div className="relative z-10 flex min-h-[250px] max-w-[72%] flex-col justify-center px-5 py-7 sm:min-h-[280px] sm:max-w-[66%] sm:px-8 md:min-h-[310px] md:max-w-[60%] md:px-10 lg:min-h-[330px] lg:max-w-[58%] lg:px-14">
                        <h1 className="text-[32px] font-black leading-[1.04] tracking-[-0.04em] text-foreground sm:text-[38px] md:text-[44px] lg:text-[48px]">
                            {t("title")}
                        </h1>
                        <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-foreground/65 sm:text-base sm:leading-7 md:text-lg">
                            {t("subtitle")}
                        </p>
                    </div>
                </section>

                {localizedFaqs.length === 0 ? (
                    <section className="rounded-[1.75rem] border border-border/40 bg-card px-6 py-16 text-center shadow-[0_18px_50px_-42px_rgba(71,51,35,0.35)]">
                        <p className="text-base font-medium text-muted-foreground">{t("noFaqs")}</p>
                    </section>
                ) : (
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
                        <section aria-labelledby="faq-list-heading" className="min-w-0">
                            <h2 id="faq-list-heading" className="sr-only">{t("listTitle")}</h2>
                            <FaqAccordion faqs={localizedFaqs} />
                        </section>

                        <aside aria-labelledby="popular-topics-heading" className="space-y-2.5">
                            <h2 id="popular-topics-heading" className="sr-only">{t("popularTopicsTitle")}</h2>
                            {topics.map((topic) => (
                                <article
                                    key={topic.title}
                                    className="rounded-2xl border border-border/40 bg-card p-4 shadow-[0_12px_35px_-30px_rgba(71,51,35,0.32)] transition-colors hover:border-border/70 sm:p-5"
                                >
                                    <h3 className="text-base font-bold tracking-[-0.015em] text-foreground">
                                        {topic.title}
                                    </h3>
                                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                        {topic.description}
                                    </p>
                                </article>
                            ))}
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}
