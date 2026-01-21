"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import "./forgot-password.css";

export default function ForgotPasswordPage() {
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
                    text: data.error || "Failed to send reset email",
                });
            }
        } catch (error) {
            console.error("Error:", error);
            setMessage({
                type: "error",
                text: "An error occurred. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-password-header">
                    <h1 className="forgot-password-title">Forgot Password?</h1>
                    <p className="forgot-password-subtitle">
                        Enter your email address and we'll send you a link to reset your
                        password.
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
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="form-input"
                            placeholder="you@example.com"
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
                                Sending...
                            </>
                        ) : (
                            "Send Reset Link"
                        )}
                    </button>
                </form>

                <div className="forgot-password-footer">
                    <Link href="/login" className="link">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
