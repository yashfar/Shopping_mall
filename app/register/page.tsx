"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function RegisterPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Registration failed");
            } else {
                setSuccess(data.message || "Registration successful");
                setTimeout(() => {
                    router.push("/login");
                }, 1000);
            }
        } catch (err: unknown) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px" }}>
            <h1 style={{ marginBottom: "20px" }}>Register</h1>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>
                        Email:
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "16px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                    />
                </div>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>
                        Password:
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "16px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                    />
                    <small style={{ color: "#666", fontSize: "12px" }}>
                        Minimum 8 characters
                    </small>
                </div>
                {error && (
                    <div
                        style={{
                            color: "red",
                            marginBottom: "15px",
                            padding: "10px",
                            backgroundColor: "#ffe6e6",
                            borderRadius: "4px",
                        }}
                    >
                        {error}
                    </div>
                )}
                {success && (
                    <div
                        style={{
                            color: "green",
                            marginBottom: "15px",
                            padding: "10px",
                            backgroundColor: "#e6ffe6",
                            borderRadius: "4px",
                        }}
                    >
                        {success}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "10px",
                        fontSize: "16px",
                        backgroundColor: loading ? "#ccc" : "#0070f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
            <p style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
                Already have an account?{" "}
                <a
                    href="/login"
                    style={{ color: "#0070f3", textDecoration: "none" }}
                >
                    Login here
                </a>
            </p>
        </div>
    );
}
