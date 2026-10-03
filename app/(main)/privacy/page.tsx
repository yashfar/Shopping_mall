import type { Metadata } from "next";
import { Clock3, Database, FileText, Mail, Settings2, Share2, ShieldCheck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import LegalPolicyPage, { type LegalSection } from "@@/components/legal/LegalPolicyPage";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("privacy");

    return {
        title: `${t("title")} | Creative Aventus`,
        description: t("metaDescription"),
        alternates: { canonical: "/privacy" },
    };
}

export default async function PrivacyPage() {
    const [t, common] = await Promise.all([
        getTranslations("privacy"),
        getTranslations("legalPages"),
    ]);
    const icons = [UserRound, Database, Settings2, Share2, Clock3, FileText, Mail];
    const ids = ["data-controller", "personal-data", "processing", "sharing", "retention", "rights", "contact"];
    const sections: LegalSection[] = ids.map((id, index) => ({
        id,
        title: t(`s${index + 1}Title`),
        body: t(`s${index + 1}Body`),
        icon: icons[index],
        wide: index === 5 || index === 6,
    }));

    return (
        <LegalPolicyPage
            title={t("title")}
            subtitle={t("subtitle")}
            lastUpdated={t("lastUpdated")}
            heroImage="/images/legal/privacy-hero.png"
            heroAlt={common("heroAlt", { page: t("title") })}
            heroIcon={ShieldCheck}
            homeLabel={common("home")}
            legalLabel={common("legal")}
            contentsLabel={common("onThisPage")}
            sections={sections}
        />
    );
}
