"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import "./reset-password.css";

export default function ResetPasswordPage() {
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
                text: "Invalid reset link. Please request a new password reset.",
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
                text: "Passwords do not match",
            });
            return;
        }

        // Validate password length
        if (newPassword.length < 8) {
            setMessage({
                type: "error",
                text: "Password must be at least 8 characters long",
            });
            return;
        }

        if (!token) {
            setMessage({
                type: "error",
                text: "Invalid reset link",
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
                    text: data.error || "Failed to reset password",
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
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="reset-password-header">
                    <h1 className="reset-password-title">Reset Password</h1>
                    <p className="reset-password-subtitle">
                        Enter your new password below.
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
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={loading || !token}
                                className="form-input"
                                placeholder="••••••••"
                                minLength={8}
                            />
                            <p className="form-hint">Minimum 8 characters</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading || !token}
                                className="form-input"
                                placeholder="••••••••"
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
                                    Resetting...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </button>
                    </form>
                ) : null}

                <div className="reset-password-footer">
                    <Link href="/login" className="link">
                        ← Back to Login
                    </Link>
                    <span className="divider">•</span>
                    <Link href="/forgot-password" className="link">
                        Request New Link
                    </Link>
                </div>
            </div>
        </div>
    );
}
