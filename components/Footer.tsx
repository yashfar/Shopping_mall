"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import CreativeAventusLogo from "@@/public/logo/Creative_Aventus_Logo_6.png";

export default function Footer() {
    const t = useTranslations("footer");
    const linkClassName = "inline-block rounded-sm text-[0.82rem] font-medium leading-5 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF8F2] md:text-sm";

    return (
        <footer className="mt-auto border-t border-border/15 bg-[#FBF8F2] text-muted-foreground">
            <div className="mx-auto max-w-[1400px] px-4 pb-5 pt-8 min-[360px]:px-5 md:px-8 md:pb-6 md:pt-12">
                <div className="grid gap-8 md:grid-cols-[minmax(220px,1.05fr)_minmax(0,2fr)] md:gap-12 lg:gap-20">
                    {/* Brand */}
                    <div className="max-w-xs">
                        <Link
                            href="/"
                            className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF8F2]"
                        >
                            <Image
                                src={CreativeAventusLogo}
                                alt={t("storeName")}
                                width={180}
                                height={68}
                                className="h-auto w-[155px] object-contain md:w-[180px]"
                            />
                        </Link>
                        <p className="mt-3 max-w-[18rem] text-[0.82rem] font-medium leading-5 text-muted-foreground md:text-sm md:leading-6">
                            {t("storeDescription")}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-7 min-[360px]:gap-x-8 sm:grid-cols-3 md:gap-x-10">
                        <nav aria-labelledby="footer-quick-links">
                            <h2 id="footer-quick-links" className="mb-3 text-sm font-bold text-foreground md:text-[0.95rem]">
                                {t("quickLinks")}
                            </h2>
                            <ul className="space-y-2">
                                <li><Link href="/about" className={linkClassName}>{t("aboutUs")}</Link></li>
                                <li><Link href="/products" className={linkClassName}>{t("products")}</Link></li>
                                <li><Link href="/orders" className={linkClassName}>{t("orders")}</Link></li>
                                <li><Link href="/cart" className={linkClassName}>{t("cart")}</Link></li>
                            </ul>
                        </nav>

                        <nav aria-labelledby="footer-support-links">
                            <h2 id="footer-support-links" className="mb-3 text-sm font-bold text-foreground md:text-[0.95rem]">
                                {t("support")}
                            </h2>
                            <ul className="space-y-2">
                                <li><Link href="/contact" className={linkClassName}>{t("contactUs")}</Link></li>
                                <li><Link href="/faq" className={linkClassName}>{t("faq")}</Link></li>
                                <li><Link href="/shipping" className={linkClassName}>{t("shippingInfo")}</Link></li>
                            </ul>
                        </nav>

                        <nav aria-labelledby="footer-legal-links" className="col-span-2 sm:col-span-1">
                            <h2 id="footer-legal-links" className="mb-3 text-sm font-bold text-foreground md:text-[0.95rem]">
                                {t("legal")}
                            </h2>
                            <ul className="grid grid-cols-2 gap-x-5 gap-y-2 sm:block sm:space-y-2">
                                <li><Link href="/privacy" className={linkClassName}>{t("privacyPolicy")}</Link></li>
                                <li><Link href="/terms" className={linkClassName}>{t("termsOfService")}</Link></li>
                                <li><Link href="/distance-sales-agreement" className={linkClassName}>{t("distanceSalesAgreement")}</Link></li>
                                <li><Link href="/returns" className={linkClassName}>{t("returns")}</Link></li>
                            </ul>
                        </nav>
                    </div>
                </div>

                {/* Payment methods */}
                <div className="mt-8 flex items-center justify-center gap-6 border-t border-border/15 py-5 min-[360px]:gap-8 md:mt-10 md:py-6">
                    <div className="flex items-center justify-center">
                        <Image
                            src="/assets/payment/iyzico-ile-ode.svg"
                            alt="iyzico ile Öde"
                            width={107}
                            height={38}
                            className="h-auto w-[82px] min-[360px]:w-[90px] md:w-[100px]"
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <Image
                            src="/assets/payment/visa.webp"
                            alt="Visa"
                            width={90}
                            height={30}
                            className="h-auto w-[60px] min-[360px]:w-[66px] md:w-[78px]"
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <Image
                            src="/assets/payment/mastercard.webp"
                            alt="Mastercard"
                            width={58}
                            height={36}
                            className="h-auto w-[40px] min-[360px]:w-[44px] md:w-[50px]"
                        />
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-border/15 pt-4 text-center md:pt-5">
                    <p className="text-xs font-medium text-muted-foreground md:text-[0.82rem]">
                        {t("copyright", { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>
        </footer>
    );
}
