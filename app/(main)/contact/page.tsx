import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ContactPageClient from "@@/components/contact/ContactPageClient";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("contact");

    return {
        title: `${t("title")} | Creative Aventus`,
        description: t("metaDescription"),
        alternates: { canonical: "/contact" },
    };
}

export default function ContactPage() {
    return <ContactPageClient />;
}
