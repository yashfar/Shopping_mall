import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
    const t = await getTranslations("privacy");

    const sections = [
        { title: t("s1Title"), body: t("s1Body") },
        { title: t("s2Title"), body: t("s2Body") },
        { title: t("s3Title"), body: t("s3Body") },
        { title: t("s4Title"), body: t("s4Body") },
        { title: t("s5Title"), body: t("s5Body") },
        { title: t("s6Title"), body: t("s6Body") },
        { title: t("s7Title"), body: t("s7Body") },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[#C8102E]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight mb-3">{t("title")}</h1>
                <p className="text-[#A9A9A9] text-lg">{t("subtitle")}</p>
                <p className="text-[#A9A9A9] text-sm mt-2">{t("lastUpdated")}</p>
            </div>

            <div className="flex flex-col gap-8">
                {sections.map((section, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">{section.title}</h2>
                        <p className="text-[#555] leading-relaxed text-[0.95rem]">{section.body}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
