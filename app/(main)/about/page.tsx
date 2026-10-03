import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
    ArrowRight,
    AtSign,
    BadgeCheck,
    Box,
    Gem,
    MapPinned,
    PackageCheck,
    PhoneCall,
    Send,
} from "lucide-react";

const valueIcons = [Gem, Box, PackageCheck];

export default async function AboutPage() {
    const t = await getTranslations("about");
    const sellerSections = t("s2Body").split("\n\n");
    const contactLines = t("s3Body").split("\n");
    const values = [t("valueOriginal"), t("valueFunctional"), t("valuePersonalized")];

    return (
        <main className="bg-[#fbf8f3] px-4 py-6 sm:px-6 sm:py-8 lg:py-12">
            <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
                <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#eadfce] shadow-[0_24px_70px_-45px_rgba(78,53,35,0.5)] ring-1 ring-black/[0.04] md:rounded-[2rem]">
                    <div className="grid lg:block lg:min-h-[520px]">
                        <div className="relative z-30 flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:min-h-[520px] lg:w-[48%] lg:px-10 lg:py-14 xl:px-14">
                            <span className="mb-4 w-fit rounded-full bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary shadow-sm ring-1 ring-black/[0.04] sm:text-xs">
                                {t("storyEyebrow")}
                            </span>
                            <h1 className="max-w-[30rem] text-[36px] font-black leading-[1.02] tracking-[-0.04em] text-foreground sm:text-[42px] lg:text-[48px] xl:text-[52px]">
                                {t("heroTitle")}
                            </h1>
                            <p className="mt-4 max-w-md text-[15px] font-medium leading-6 text-foreground/65 sm:text-base sm:leading-7">
                                {t("subtitle")}
                            </p>
                            <Link
                                href="/products"
                                className="mt-7 inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {t("exploreProducts")}
                                <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                            </Link>
                        </div>

                        <div className="relative -mt-12 min-h-[380px] overflow-hidden sm:min-h-[430px] lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:min-h-0 lg:w-[68%]">
                            <Image
                                src="/about/hero-vase.png"
                                alt=""
                                fill
                                priority
                                sizes="(max-width: 1023px) 100vw, 56vw"
                                className="object-cover object-[50%_58%] lg:object-[50%_36%]"
                            />
                            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#eadfce] via-[#eadfce]/75 to-transparent lg:hidden" />
                        </div>
                    </div>
                    <div className="pointer-events-none absolute inset-0 z-20 hidden bg-[linear-gradient(90deg,rgba(234,223,206,1)_0%,rgba(234,223,206,0.98)_34%,rgba(234,223,206,0.80)_46%,rgba(234,223,206,0.44)_58%,rgba(234,223,206,0.12)_68%,rgba(234,223,206,0)_76%)] lg:block" />
                </section>

                <section className="grid gap-6 lg:grid-cols-12">
                    <div className="relative min-h-[420px] overflow-hidden rounded-[1.75rem] shadow-[0_22px_55px_-42px_rgba(64,43,29,0.55)] ring-1 ring-black/[0.04] sm:min-h-[520px] lg:col-span-5 lg:min-h-[610px]">
                        <Image
                            src="/about/brand-visual.png"
                            alt=""
                            fill
                            sizes="(max-width: 1023px) 100vw, 42vw"
                            className="object-cover object-center"
                        />
                    </div>

                    <div className="flex flex-col justify-between rounded-[1.75rem] bg-white p-6 shadow-[0_22px_55px_-44px_rgba(64,43,29,0.4)] ring-1 ring-black/[0.04] sm:p-9 lg:col-span-7 lg:p-12">
                        <div>
                            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-primary/75">
                                {t("brandEyebrow")}
                            </span>
                            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-foreground sm:text-3xl lg:text-[34px]">
                                {t("s1Title")}
                            </h2>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/65 sm:text-[15px] sm:leading-7 lg:text-base">
                                {t("s1Body")}
                            </p>
                        </div>

                        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:mt-14">
                            {values.map((value, index) => {
                                const Icon = valueIcons[index];
                                return (
                                    <div key={value} className="flex items-center gap-3 rounded-2xl bg-[#fbf6ef] p-4 sm:flex-col sm:items-start sm:p-5">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-black/[0.04]">
                                            <Icon className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} aria-hidden="true" />
                                        </span>
                                        <span className="text-sm font-bold leading-5 text-foreground">{value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-12">
                    <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#f4e4df] p-6 shadow-[0_20px_55px_-44px_rgba(77,45,38,0.38)] ring-1 ring-black/[0.04] sm:p-9 lg:col-span-7 lg:min-h-[430px] lg:p-12">
                        <Image
                            src="/about/ambient-background.png"
                            alt=""
                            fill
                            sizes="(max-width: 1023px) 100vw, 58vw"
                            className="-z-20 object-cover object-center opacity-80"
                        />
                        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fff9f5] via-[#fff9f5]/95 to-[#fff9f5]/55" />
                        <div className="max-w-xl">
                            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-primary/75">
                                {t("sellerEyebrow")}
                            </span>
                            <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-foreground sm:text-3xl lg:text-[34px]">
                                {t("s2Title")}
                            </h2>
                            <p className="mt-4 text-sm leading-6 text-foreground/70 sm:text-[15px] sm:leading-7 lg:text-base">
                                {sellerSections[0]}
                            </p>
                            {sellerSections[1] && (
                                <div className="mt-6 flex gap-3 rounded-2xl bg-white/75 p-4 backdrop-blur-sm ring-1 ring-black/[0.04] sm:p-5">
                                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <MapPinned className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                                    </span>
                                    <p className="text-sm font-medium leading-6 text-foreground/70">{sellerSections[1]}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_20px_55px_-44px_rgba(64,43,29,0.4)] ring-1 ring-black/[0.04] sm:p-9 lg:col-span-5 lg:p-10">
                        <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-primary/75">
                            {t("contactEyebrow")}
                        </span>
                        <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-foreground sm:text-3xl lg:text-[34px]">
                            {t("s3Title")}
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-foreground/60 sm:text-[15px] sm:leading-7 lg:text-base">
                            {t("contactIntro")}
                        </p>

                        <div className="mt-8 space-y-3">
                            {contactLines.map((line, index) => {
                                const Icon = index === 0 ? AtSign : PhoneCall;
                                const href = index === 0 ? "mailto:yasarfarhadi@gmail.com" : "tel:+905510827215";
                                return (
                                    <a
                                        key={line}
                                        href={href}
                                        className="group flex min-h-14 items-center gap-4 rounded-2xl bg-[#fbf8f3] p-4 text-sm font-semibold text-foreground/70 transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-black/[0.04]">
                                            <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                                        </span>
                                        <span className="break-all sm:break-normal">{line}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#fff4ef] via-[#fce9e5] to-[#f5ded9] p-6 shadow-[0_20px_55px_-44px_rgba(95,47,40,0.38)] ring-1 ring-primary/[0.06] sm:p-9 lg:p-12">
                    <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-14">
                        <div className="max-w-3xl">
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-primary shadow-sm ring-1 ring-black/[0.04]">
                                <BadgeCheck className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                            </span>
                            <span className="ml-3 align-middle text-[0.68rem] font-black uppercase tracking-[0.2em] text-primary/75">
                                {t("personalizedEyebrow")}
                            </span>
                            <h2 className="mt-5 text-2xl font-black tracking-[-0.035em] text-foreground sm:text-3xl lg:text-[34px]">
                                {t("personalizedTitle")}
                            </h2>
                            <p className="mt-4 text-sm leading-6 text-foreground/65 sm:text-[15px] sm:leading-7 lg:text-base">
                                {t("personalizedBody")}
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-3 lg:w-[20rem]">
                            <a
                                href="mailto:yasarfarhadi@gmail.com"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-center text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <Send className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} aria-hidden="true" />
                                {t("emailCta")}
                            </a>
                            <a
                                href="tel:+905510827215"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-white/75 px-5 py-3 text-center text-sm font-bold text-primary transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <PhoneCall className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} aria-hidden="true" />
                                {t("phoneCta")}
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
