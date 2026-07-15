import { prisma } from "@/lib/prisma";
import { getTranslations, getLocale } from "next-intl/server";
import FaqAccordion from "./FaqAccordion";

export default async function FaqPage() {
    const t = await getTranslations("faq");
    const locale = await getLocale();

    const faqs = await prisma.faq.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, question: true, questionEn: true, answer: true, answerEn: true },
    });

    const localizedFaqs = faqs.map((f) => ({
        id: f.id,
        question: (locale === "en" && f.questionEn) ? f.questionEn : f.question,
        answer: (locale === "en" && f.answerEn) ? f.answerEn : f.answer,
    }));

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[#C8102E]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight mb-3">{t("title")}</h1>
                <p className="text-[#A9A9A9] text-lg">{t("subtitle")}</p>
            </div>

            {localizedFaqs.length === 0 ? (
                <div className="text-center py-20 text-[#A9A9A9]">
                    <p className="text-lg font-medium">{t("noFaqs")}</p>
                </div>
            ) : (
                <FaqAccordion faqs={localizedFaqs} />
            )}
        </div>
    );
}
