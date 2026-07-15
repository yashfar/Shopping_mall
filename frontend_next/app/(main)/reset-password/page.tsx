"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Lock, KeyRound } from "lucide-react";
import { Button } from "@@/components/ui/button";
import { cn } from "@@/lib/utils";

function PasswordInput({
    id,
    value,
    onChange,
    disabled,
    placeholder,
    label,
    required,
}: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    placeholder?: string;
    label: string;
    required?: boolean;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                {label}
            </label>
            <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder ?? "••••••••"}
                    disabled={disabled}
                    required={required}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium placeholder:text-gray-400 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                    {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

function StrengthBar({ password }: { password: string }) {
    const t = useTranslations("resetPassword");
    if (!password) return null;

    const score = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
    ].filter(Boolean).length;

    const color = score <= 1 ? "bg-red-400" : score === 2 ? "bg-orange-400" : score === 3 ? "bg-yellow-400" : "bg-emerald-500";
    const label = score <= 1 ? t("strengthWeak") : score === 2 ? t("strengthFair") : score === 3 ? t("strengthGood") : t("strengthStrong");
    const labelColor = score <= 1 ? "text-red-400" : score === 2 ? "text-orange-400" : score === 3 ? "text-yellow-500" : "text-emerald-500";

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", i < score ? color : "bg-gray-200")} />
                ))}
            </div>
            <p className={cn("text-xs font-bold", labelColor)}>{label}</p>
        </div>
    );
}

function ResetPasswordForm() {
    const t = useTranslations("resetPassword");
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (!token) {
            setMessage({ type: "error", text: t("invalidLink") });
        }
    }, [token, t]);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: t("passwordMismatch") });
            return;
        }

        if (newPassword.length < 8) {
            setMessage({ type: "error", text: t("passwordTooShort") });
            return;
        }

        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setSucceeded(true);
                setMessage({ type: "success", text: t("success") });
                setTimeout(() => router.push("/login"), 2500);
            } else {
                setMessage({ type: "error", text: data.error || t("failed") });
            }
        } catch {
            setMessage({ type: "error", text: t("genericError") });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-8">
                    {/* Icon + title */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="w-7 h-7 text-primary" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("title")}</h1>
                        <p className="text-sm text-gray-500 mt-2">{t("subtitle")}</p>
                    </div>

                    {/* Status message */}
                    {message && (
                        <div className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-2xl mb-6 text-sm font-medium border animate-in fade-in slide-in-from-top-2",
                            message.type === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-red-50 text-red-600 border-red-100"
                        )}>
                            <span className={cn(
                                "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
                                message.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                            )}>
                                {message.type === "success" ? "✓" : "!"}
                            </span>
                            <span>
                                {message.text}
                                {succeeded && (
                                    <span className="block text-xs mt-0.5 text-emerald-600/70">{t("redirecting")}</span>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Form — hide after success */}
                    {!succeeded && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <PasswordInput
                                    id="newPassword"
                                    label={t("newPassword")}
                                    value={newPassword}
                                    onChange={setNewPassword}
                                    disabled={loading || !token}
                                    required
                                />
                                <StrengthBar password={newPassword} />
                                <p className="mt-1.5 text-xs text-gray-400">{t("passwordHint")}</p>
                            </div>

                            <div>
                                <PasswordInput
                                    id="confirmPassword"
                                    label={t("confirmPassword")}
                                    value={confirmPassword}
                                    onChange={setConfirmPassword}
                                    disabled={loading || !token}
                                    required
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="mt-1.5 text-xs text-red-500 font-medium">{t("passwordMismatch")}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full rounded-xl font-bold py-6 bg-primary hover:bg-destructive shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all gap-2 disabled:opacity-70 disabled:shadow-none disabled:translate-y-0"
                            >
                                {loading && (
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                )}
                                {loading ? t("resetting") : t("resetPassword")}
                            </Button>
                        </form>
                    )}

                    {/* Footer links */}
                    <div className="flex items-center justify-center gap-3 mt-6 text-sm">
                        <Link href="/login" className="text-gray-400 hover:text-gray-600 font-medium transition-colors">
                            ← {t("backToLogin")}
                        </Link>
                        <span className="text-gray-200">•</span>
                        <Link href="/forgot-password" className="text-gray-400 hover:text-primary font-medium transition-colors">
                            {t("requestNewLink")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <span className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-primary animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
