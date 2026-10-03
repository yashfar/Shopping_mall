"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
    CheckCircle2,
    ChevronRight,
    Clock3,
    Headphones,
    Loader2,
    Mail,
    MapPin,
    MessageCircleMore,
    MessageSquareText,
    Phone,
    Send,
    UserRound,
} from "lucide-react";
import { Button } from "@@/components/ui/button";

const fieldClassName =
    "min-h-12 w-full rounded-xl border border-border/40 bg-background/80 py-3 pr-4 text-sm font-medium text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/65 hover:border-border/70 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function ContactPageClient() {
    const t = useTranslations("contact");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
            toast.error(t("fillAllFields"));
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, subject, message }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t("failedToSend"));
            }

            setSent(true);
            toast.success(t("messageSentToast"));
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : t("failedToSend"));
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSent(false);
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
    };

    if (sent) {
        return (
            <div className="bg-[#fbfaf7] px-4 py-16 sm:py-24">
                <div
                    role="status"
                    className="mx-auto max-w-2xl rounded-[1.75rem] border border-emerald-100 bg-white p-8 text-center shadow-[0_24px_70px_-48px_rgba(21,128,61,0.45)] sm:p-12"
                >
                    <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 aria-hidden="true" className="size-8" strokeWidth={1.8} />
                    </div>
                    <h1 className="text-2xl font-black tracking-[-0.03em] text-foreground sm:text-3xl">
                        {t("messageSent")}
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                        {t("thankYou")}
                    </p>
                    <Button
                        type="button"
                        onClick={resetForm}
                        variant="outline"
                        className="mt-7 min-h-11 rounded-xl px-5 font-semibold"
                    >
                        {t("sendAnother")}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#fbfaf7]">
            <div className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-5 sm:py-7 lg:px-8 lg:py-9">
                <section className="relative isolate min-h-[300px] overflow-hidden rounded-[1.75rem] border border-black/[0.04] bg-[#f6efe5] shadow-[0_16px_50px_-36px_rgba(68,49,31,0.45)] sm:min-h-[330px] lg:min-h-[350px]">
                    <Image
                        src="/images/contact/contact-hero.png"
                        alt={t("heroAlt")}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 1440px"
                        className="object-cover object-[67%_center] sm:object-[65%_center] lg:object-center"
                    />
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,247,0.99)_0%,rgba(255,252,247,0.96)_38%,rgba(255,252,247,0.76)_57%,rgba(255,252,247,0.08)_83%)]"
                    />
                    <div className="relative z-10 flex min-h-[300px] max-w-[78%] flex-col justify-center px-5 py-7 sm:min-h-[330px] sm:max-w-[64%] sm:px-8 lg:min-h-[350px] lg:max-w-[56%] lg:px-12">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-white/80 bg-white/75 text-primary shadow-sm backdrop-blur-sm sm:size-14">
                            <MessageCircleMore aria-hidden="true" className="size-6 sm:size-7" strokeWidth={1.8} />
                        </div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary/80">
                            {t("heroEyebrow")}
                        </p>
                        <h1 className="max-w-2xl text-[clamp(2rem,4.3vw,3rem)] font-black leading-[1.02] tracking-[-0.045em] text-foreground">
                            {t("title")}
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                            {t("subtitle")}
                        </p>
                    </div>
                </section>

                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
                    <section className="order-1 rounded-2xl border border-black/[0.055] bg-white/90 p-5 shadow-[0_14px_45px_-36px_rgba(57,42,28,0.55)] sm:p-6 lg:col-start-1 lg:row-start-1">
                        <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground sm:text-2xl">
                            {t("contactOptionsTitle")}
                        </h2>
                        <div className="mt-4 space-y-3">
                            <a
                                href={`mailto:${t("emailAddress")}`}
                                className="group flex min-h-20 items-center gap-4 rounded-2xl border border-border/40 bg-[#fffdf9] p-4 transition-colors hover:border-border/70 hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-primary">
                                    <Mail aria-hidden="true" className="size-5" strokeWidth={1.8} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-bold text-foreground">{t("emailUs")}</span>
                                    <span className="mt-0.5 block break-all text-sm text-muted-foreground">{t("emailAddress")}</span>
                                </span>
                                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-primary/60 transition-transform group-hover:translate-x-0.5" />
                            </a>

                            <a
                                href={`tel:${t("phoneNumber").replace(/\s/g, "")}`}
                                className="group flex min-h-20 items-center gap-4 rounded-2xl border border-border/40 bg-[#fffdf9] p-4 transition-colors hover:border-border/70 hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-primary">
                                    <Phone aria-hidden="true" className="size-5" strokeWidth={1.8} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-bold text-foreground">{t("phoneUs")}</span>
                                    <span className="mt-0.5 block text-sm text-muted-foreground">{t("phoneNumber")}</span>
                                </span>
                                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-primary/60 transition-transform group-hover:translate-x-0.5" />
                            </a>

                            <div className="flex min-h-20 items-center gap-4 rounded-2xl border border-border/40 bg-[#fffdf9] p-4">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-primary">
                                    <Clock3 aria-hidden="true" className="size-5" strokeWidth={1.8} />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-bold text-foreground">{t("responseTime")}</span>
                                    <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{t("responseTimeDescription")}</span>
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="order-2 rounded-2xl border border-black/[0.055] bg-white/95 p-5 shadow-[0_20px_60px_-42px_rgba(57,42,28,0.6)] sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground sm:text-2xl">
                                {t("formTitle")}
                            </h2>
                            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{t("formDescription")}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-semibold text-foreground">
                                        {t("yourName")}
                                    </label>
                                    <div className="relative">
                                        <UserRound aria-hidden="true" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            autoComplete="name"
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            placeholder={t("namePlaceholder")}
                                            required
                                            disabled={submitting}
                                            className={`${fieldClassName} pl-10`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-foreground">
                                        {t("emailLabel")}
                                    </label>
                                    <div className="relative">
                                        <Mail aria-hidden="true" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            placeholder={t("emailPlaceholder")}
                                            required
                                            disabled={submitting}
                                            className={`${fieldClassName} pl-10`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-foreground">
                                    {t("subject")}
                                </label>
                                <div className="relative">
                                    <MessageSquareText aria-hidden="true" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={subject}
                                        onChange={(event) => setSubject(event.target.value)}
                                        placeholder={t("subjectPlaceholder")}
                                        required
                                        disabled={submitting}
                                        className={`${fieldClassName} pl-10`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="message" className="mb-2 block text-sm font-semibold text-foreground">
                                    {t("message")}
                                </label>
                                <div className="relative">
                                    <MessageCircleMore aria-hidden="true" className="absolute left-3.5 top-4 size-4 text-muted-foreground" />
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        placeholder={t("messagePlaceholder")}
                                        rows={6}
                                        required
                                        disabled={submitting}
                                        className={`${fieldClassName} resize-y pl-10`}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="min-h-12 w-full rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-[0_12px_28px_-18px_rgba(200,16,46,0.75)] transition-all hover:bg-primary/90 hover:shadow-[0_16px_32px_-18px_rgba(200,16,46,0.8)] focus-visible:ring-primary disabled:opacity-70"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 aria-hidden="true" className="mr-2 size-5 animate-spin" />
                                        {t("sending")}
                                    </>
                                ) : (
                                    <>
                                        <Send aria-hidden="true" className="mr-2 size-5" strokeWidth={1.8} />
                                        {t("sendMessage")}
                                    </>
                                )}
                            </Button>
                        </form>
                    </section>

                    <div className="order-3 space-y-4 lg:col-start-1 lg:row-start-2">
                        <aside className="rounded-2xl border border-primary/10 bg-[linear-gradient(135deg,rgba(255,247,240,0.96),rgba(255,241,243,0.82))] p-5 shadow-[0_14px_45px_-38px_rgba(88,50,45,0.5)] sm:p-6">
                            <div className="flex items-start gap-4">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm">
                                    <Headphones aria-hidden="true" className="size-5" strokeWidth={1.8} />
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">{t("quickHelp")}</h2>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("quickHelpDescription")}</p>
                                    <Button asChild variant="outline" className="mt-4 min-h-11 rounded-xl border-primary/15 bg-white/75 px-4 font-semibold text-primary hover:bg-white hover:text-primary">
                                        <Link href="/orders">
                                            {t("viewOrders")}
                                            <ChevronRight aria-hidden="true" className="ml-1.5 size-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </aside>

                        <aside className="rounded-2xl border border-black/[0.055] bg-[#f6f0e7]/75 p-5 sm:p-6">
                            <div className="flex items-start gap-4">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm">
                                    <MapPin aria-hidden="true" className="size-5" strokeWidth={1.8} />
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">{t("addressTitle")}</h2>
                                    <address className="mt-1 text-sm not-italic leading-6 text-muted-foreground">{t("address")}</address>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}
