import type { Metadata } from "next";
import { BadgeDollarSign, CircleAlert, Copyright, CreditCard, FileText, Scale, ShieldCheck, Truck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import LegalPolicyPage, { type LegalSection } from "@@/components/legal/LegalPolicyPage";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("terms");

    return {
        title: `${t("title")} | Creative Aventus`,
        description: t("metaDescription"),
        alternates: { canonical: "/terms" },
    };
}

export default async function TermsPage() {
    const [t, common] = await Promise.all([
        getTranslations("terms"),
        getTranslations("legalPages"),
    ]);
    const icons = [ShieldCheck, UserRound, BadgeDollarSign, CreditCard, Truck, Copyright, CircleAlert, Scale];
    const ids = ["acceptance", "account", "products-prices", "orders-payment", "shipping-delivery", "intellectual-property", "liability", "governing-law"];
    const sections: LegalSection[] = ids.map((id, index) => ({
        id,
        title: t(`s${index + 1}Title`),
        body: t(`s${index + 1}Body`),
        icon: icons[index],
    }));

    return (
        <LegalPolicyPage
            title={t("title")}
            subtitle={t("subtitle")}
            lastUpdated={t("lastUpdated")}
            heroImage="/images/legal/terms-hero.png"
            heroAlt={common("heroAlt", { page: t("title") })}
            heroIcon={FileText}
            homeLabel={common("home")}
            legalLabel={common("legal")}
            contentsLabel={common("onThisPage")}
            sections={sections}
        />
    );
}
