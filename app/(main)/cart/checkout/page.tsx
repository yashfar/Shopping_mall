import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import CheckoutContent from "../CheckoutContent";
import { auth } from "@@/lib/auth-helper";
import styles from "./checkout-layout.module.css";

export default async function CheckoutReviewPage() {
  const t = await getTranslations("checkout");
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/cart");
  }

  return (
    <main className={styles.checkoutPage}>
      <div className={styles.checkoutContainer}>
        <Link
          href="/cart"
          className={`${styles.backLink} group`}
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4 transition-transform group-hover:-translate-x-1"
          />
          {t("backToCart")}
        </Link>

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t("reviewOrder")}</h1>
          <p className={styles.pageSubtitle}>
            {t("reviewOrderDesc")}
          </p>
        </header>

        <CheckoutContent />
      </div>
    </main>
  );
}
