import { getTranslations } from "next-intl/server";

export default async function ReturnsPage() {
    const t = await getTranslations("returns");

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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
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
