import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
    const t = await getTranslations("about");
    const sections = [
        { title: t("s1Title"), body: t("s1Body") },
        { title: t("s2Title"), body: t("s2Body") },
        { title: t("s3Title"), body: t("s3Body") },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-5 text-2xl" aria-hidden="true">CA</div>
                <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight mb-3">{t("title")}</h1>
                <p className="text-[#A9A9A9] text-lg">{t("subtitle")}</p>
            </div>
            <div className="flex flex-col gap-8">
                {sections.map((section) => (
                    <section key={section.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">{section.title}</h2>
                        <p className="text-[#555] leading-relaxed text-[0.95rem] whitespace-pre-line">{section.body}</p>
                    </section>
                ))}
                <section className="bg-red-50 border border-red-100 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">{t("personalizedTitle")}</h2>
                    <p className="text-[#555] leading-relaxed text-[0.95rem] mb-4">{t("personalizedBody")}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <a href="mailto:yasarfarhadi@gmail.com" className="inline-flex justify-center rounded-xl bg-[#C8102E] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#A90D27] transition-colors">
                            {t("emailCta")}
                        </a>
                        <a href="tel:+905510827215" className="inline-flex justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-[#C8102E] hover:bg-red-50 transition-colors">
                            {t("phoneCta")}
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
