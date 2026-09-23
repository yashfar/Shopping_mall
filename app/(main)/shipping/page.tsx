import { getTranslations } from "next-intl/server";

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
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[#C8102E]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6.75m-9.75 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-1.5m-.75-11.177v-.948c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125V14.25m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                </div>
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
                    <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">{t("personalizedContactTitle")}</h2>
                    <p className="text-[#555] leading-relaxed text-[0.95rem] mb-4">{t("personalizedContactBody")}</p>
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
