import { getTranslations } from "next-intl/server";

export default async function DistanceSalesAgreementPage() {
    const t = await getTranslations("distanceSalesAgreement");
    const sections = Array.from({ length: 10 }, (_, index) => ({
        title: t(`s${index + 1}Title`),
        body: t(`s${index + 1}Body`),
    }));

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[#C8102E]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight mb-3">{t("title")}</h1>
                <p className="text-[#A9A9A9] text-lg">{t("subtitle")}</p>
            </div>
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <p className="font-bold">{t("draftTitle")}</p>
                <p className="mt-1 text-sm leading-relaxed">{t("draftBody")}</p>
            </div>
            <div className="flex flex-col gap-8">
                {sections.map((section) => (
                    <section key={section.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">{section.title}</h2>
                        <p className="text-[#555] leading-relaxed text-[0.95rem] whitespace-pre-line">{section.body}</p>
                    </section>
                ))}
            </div>
        </div>
    );
}
