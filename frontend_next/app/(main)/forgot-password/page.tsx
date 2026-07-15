"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
    const t = useTranslations("forgotPassword");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: data.message,
                });
                setEmail(""); // Clear form
            } else {
                setMessage({
                    type: "error",
                    text: data.error || t("failedToSend"),
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
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-password-header">
                    <h1 className="forgot-password-title">{t("title")}</h1>
                    <p className="forgot-password-subtitle">
                        {t("subtitle")}
                    </p>
                </div>

                {message && (
                    <div className={`message message-${message.type}`}>
                        {message.type === "success" ? "✓" : "✕"} {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="forgot-password-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            {t("emailLabel")}
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="form-input"
                            placeholder={t("emailPlaceholder")}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                {t("sending")}
                            </>
                        ) : (
                            t("sendResetLink")
                        )}
                    </button>
                </form>

                <div className="forgot-password-footer">
                    <Link href="/login" className="link">
                        ← {t("backToLogin")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
