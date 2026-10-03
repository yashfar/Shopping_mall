import type { Metadata } from "next";
import { Banknote, Ban, CalendarDays, FileCheck2, PackageCheck, RefreshCcw, RotateCcw, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import LegalPolicyPage, { type LegalSection } from "@@/components/legal/LegalPolicyPage";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("returns");

    return {
        title: `${t("title")} | Creative Aventus`,
        description: t("metaDescription"),
        alternates: { canonical: "/returns" },
    };
}

export default async function ReturnsPage() {
    const [t, common] = await Promise.all([
        getTranslations("returns"),
        getTranslations("legalPages"),
    ]);
    const icons = [CalendarDays, PackageCheck, Ban, FileCheck2, Truck, Banknote, RefreshCcw];
    const ids = ["return-period", "conditions", "non-returnable", "return-process", "shipping-costs", "refunds", "exchanges"];
    const sections: LegalSection[] = ids.map((id, index) => ({
        id,
        title: t(`s${index + 1}Title`),
        body: t(`s${index + 1}Body`),
        icon: icons[index],
        wide: index === 3 || index === 6,
    }));

    return (
        <LegalPolicyPage
            title={t("title")}
            subtitle={t("subtitle")}
            lastUpdated={t("lastUpdated")}
            heroImage="/images/legal/returns-hero.png"
            heroAlt={common("heroAlt", { page: t("title") })}
            heroIcon={RotateCcw}
            homeLabel={common("home")}
            legalLabel={common("legal")}
            contentsLabel={common("onThisPage")}
            sections={sections}
        />
    );
}
