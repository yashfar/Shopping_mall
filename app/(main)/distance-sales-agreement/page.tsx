import type { Metadata } from "next";
import { BadgeDollarSign, CreditCard, FileCheck2, FileText, MessageCircleQuestion, PackageCheck, RefreshCcw, Sparkles, Truck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import LegalPolicyPage, { type LegalSection } from "@@/components/legal/LegalPolicyPage";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("distanceSalesAgreement");

    return {
        title: `${t("title")} | Creative Aventus`,
        description: t("metaDescription"),
        alternates: { canonical: "/distance-sales-agreement" },
    };
}

export default async function DistanceSalesAgreementPage() {
    const [t, common] = await Promise.all([
        getTranslations("distanceSalesAgreement"),
        getTranslations("legalPages"),
    ]);
    const icons = [UserRound, FileText, BadgeDollarSign, CreditCard, Truck, RefreshCcw, PackageCheck, Sparkles, MessageCircleQuestion, FileCheck2];
    const ids = ["parties", "scope", "product-price", "payment", "preparation-delivery", "withdrawal", "returns-refunds", "personalized-products", "complaints", "records"];
    const sections: LegalSection[] = ids.map((id, index) => ({
        id,
        title: t(`s${index + 1}Title`),
        body: t(`s${index + 1}Body`),
        icon: icons[index],
        wide: index === 0 || index === 6,
    }));

    return (
        <LegalPolicyPage
            title={t("title")}
            subtitle={t("subtitle")}
            lastUpdated={t("lastUpdated")}
            heroImage="/images/legal/distance-sales-hero.png"
            heroAlt={common("heroAlt", { page: t("title") })}
            heroIcon={FileText}
            homeLabel={common("home")}
            legalLabel={common("legal")}
            contentsLabel={common("onThisPage")}
            notice={{ title: t("draftTitle"), body: t("draftBody") }}
            sections={sections}
        />
    );
}
