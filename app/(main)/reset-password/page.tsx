"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import "./reset-password.css";

function ResetPasswordForm() {
    const t = useTranslations("resetPassword");
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // Check if token exists
    useEffect(() => {
        if (!token) {
            setMessage({
                type: "error",
                text: t("invalidLink"),
            });
        }
    }, [token]);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage(null);

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setMessage({
                type: "error",
                text: t("passwordMismatch"),
            });
            return;
        }

        // Validate password length
        if (newPassword.length < 8) {
            setMessage({
                type: "error",
                text: t("passwordTooShort"),
            });
            return;
        }

        if (!token) {
            setMessage({
                type: "error",
                text: t("invalidLinkTitle"),
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: data.message,
                });

                // Clear form
                setNewPassword("");
                setConfirmPassword("");

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                setMessage({
                    type: "error",
                    text: data.error || t("failed"),
                });
            }
        } catch (error) {
            console.error("Error:", error);
            setMessage({
                type: "error",
                text: t("genericError"),
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="reset-password-header">
                    <h1 className="reset-password-title">{t("title")}</h1>
                    <p className="reset-password-subtitle">
                        {t("subtitle")}
                    </p>
                </div>

                {message && (
                    <div className={`message message-${message.type}`}>
                        {message.type === "success" ? "✓" : "✕"} {message.text}
                        {message.type === "success" && (
                            <p className="redirect-text">Redirecting to login...</p>
                        )}
                    </div>
                )}

                {!message || message.type !== "success" ? (
                    <form onSubmit={handleSubmit} className="reset-password-form">
                        <div className="form-group">
                            <label htmlFor="newPassword" className="form-label">
                                {t("newPassword")}
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={loading || !token}
                                className="form-input"
                                placeholder={t("passwordPlaceholder")}
                                minLength={8}
                            />
                            <p className="form-hint">{t("passwordHint")}</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                {t("confirmPassword")}
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading || !token}
                                className="form-input"
                                placeholder={t("passwordPlaceholder")}
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="btn-primary"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    {t("resetting")}
                                </>
                            ) : (
                                t("resetPassword")
                            )}
                        </button>
                    </form>
                ) : null}

                <div className="reset-password-footer">
                    <Link href="/login" className="link">
                        ← {t("backToLogin")}
                    </Link>
                    <span className="divider">•</span>
                    <Link href="/forgot-password" className="link">
                        {t("requestNewLink")}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="flex items-center justify-center p-8">
                        <span className="spinner"></span>
                    </div>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
