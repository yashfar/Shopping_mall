"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@@/components/ui/button";
import { cn } from "@@/lib/utils";

interface PasswordSectionProps {
    hasPassword: boolean;
    onPasswordSet?: () => void;
}

type Mode = "idle" | "set" | "change";

function StrengthBar({ password }: { password: string }) {
    const t = useTranslations("profile");
    if (!password) return null;

    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;

    const barColor = score <= 1 ? "bg-red-400" : score === 2 ? "bg-orange-400" : score === 3 ? "bg-yellow-400" : "bg-emerald-500";
    const label =
        score <= 1 ? t("passwordStrengthWeak") :
        score === 2 ? t("passwordStrengthFair") :
        score === 3 ? t("passwordStrengthGood") :
        t("passwordStrengthStrong");
    const labelColor = score <= 1 ? "text-red-400" : score === 2 ? "text-orange-400" : score === 3 ? "text-yellow-500" : "text-emerald-500";

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-1 flex-1 rounded-full transition-all duration-300",
                            i < score ? barColor : "bg-gray-200"
                        )}
                    />
                ))}
            </div>
            <p className={cn("text-xs font-bold", labelColor)}>{label}</p>
        </div>
    );
}

function PasswordInput({
    id,
    value,
    onChange,
    disabled,
    placeholder = "••••••••",
}: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    placeholder?: string;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
                id={id}
                type={visible ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium placeholder:text-gray-400 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setVisible((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label={visible ? "Hide password" : "Show password"}
            >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
}

const labelClass = "text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block";

export default function PasswordSection({ hasPassword, onPasswordSet }: PasswordSectionProps) {
    const t = useTranslations("profile");

    const [mode, setMode] = useState<Mode>("idle");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const resetForm = () => {
        setMode("idle");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: t("passwordMismatch") });
            return;
        }

        const endpoint =
            mode === "set"
                ? "/api/profile/set-password"
                : "/api/profile/change-password";

        const body =
            mode === "set"
                ? { newPassword, confirmPassword }
                : { currentPassword, newPassword, confirmPassword };

        setIsLoading(true);
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (res.ok) {
                const successText =
                    mode === "set" ? t("setPasswordSuccess") : t("changePasswordSuccess");
                setMessage({ type: "success", text: successText });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                onPasswordSet?.();
            } else {
                setMessage({ type: "error", text: data.error });
            }
        } catch {
            setMessage({ type: "error", text: t("failedToUpdate") });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
            {/* Header */}
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                        {t("passwordManagement")}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {hasPassword ? t("changePasswordDesc") : t("setPasswordDesc")}
                    </p>
                </div>
                <span className={cn(
                    "inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full text-xs font-black border",
                    hasPassword
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-orange-50 text-orange-500 border-orange-100"
                )}>
                    {hasPassword
                        ? <><ShieldCheck className="w-3.5 h-3.5" />{t("passwordSet")}</>
                        : <><Lock className="w-3.5 h-3.5" />{t("noPassword")}</>
                    }
                </span>
            </div>

            {/* Expanded form */}
            {mode !== "idle" && (
                <>
                    <div className="border-t border-gray-100" />
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                        {/* Status message */}
                        {message && (
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium border animate-in fade-in slide-in-from-top-2",
                                message.type === "success"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-red-50 text-red-600 border-red-100"
                            )}>
                                <span className={cn(
                                    "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
                                    message.type === "success"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-red-100 text-red-600"
                                )}>
                                    {message.type === "success" ? "✓" : "!"}
                                </span>
                                {message.text}
                            </div>
                        )}

                        {/* Current password — change mode only */}
                        {mode === "change" && (
                            <div>
                                <label htmlFor="currentPassword" className={labelClass}>
                                    {t("currentPassword")}
                                </label>
                                <PasswordInput
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={setCurrentPassword}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {/* New password */}
                        <div>
                            <label htmlFor="newPassword" className={labelClass}>
                                {t("newPassword")}
                            </label>
                            <PasswordInput
                                id="newPassword"
                                value={newPassword}
                                onChange={setNewPassword}
                                disabled={isLoading}
                            />
                            <StrengthBar password={newPassword} />
                            <p className="mt-1.5 text-xs text-gray-400 font-medium">{t("passwordHint")}</p>
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label htmlFor="confirmPassword" className={labelClass}>
                                {t("confirmPassword")}
                            </label>
                            <PasswordInput
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                disabled={isLoading}
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium">
                                    {t("passwordMismatch")}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                                disabled={isLoading}
                                className="w-full sm:w-auto rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto rounded-xl font-bold bg-primary hover:bg-destructive shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                            >
                                {isLoading && (
                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                )}
                                {isLoading
                                    ? t("saving")
                                    : mode === "set"
                                    ? t("setPassword")
                                    : t("changePassword")}
                            </Button>
                        </div>
                    </form>
                </>
            )}

            {/* Open button — idle state */}
            {mode === "idle" && (
                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                    <Button
                        onClick={() => { setMessage(null); setMode(hasPassword ? "change" : "set"); }}
                        className="rounded-xl font-bold bg-primary hover:bg-destructive shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                    >
                        {hasPassword ? t("changePassword") : t("setPassword")}
                    </Button>
                </div>
            )}
        </div>
    );
}
