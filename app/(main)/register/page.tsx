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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#FAFAFA] p-6 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(200,16,46,0.03)_0%,transparent_70%)] z-0" />

            <div className="w-full max-w-[480px] bg-white rounded-[24px] border border-[#A9A9A9] shadow-[0_10px_40px_rgba(0,0,0,0.04)] p-12 relative z-10">
                <h1 className="text-[2.5rem] font-black text-[#1A1A1A] text-center mb-3 tracking-tighter">Create Account</h1>
                <p className="text-center text-[#A9A9A9] font-medium mb-10">Join our community today</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2 tracking-tight">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="you@example.com"
                            className="w-full px-[18px] py-[14px] text-base border border-[#A9A9A9] rounded-xl transition-all duration-300 focus:outline-none focus:border-[#C8102E] focus:ring-4 focus:ring-[#C8102E]/5"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2 tracking-tight">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            disabled={loading}
                            placeholder="••••••••"
                            className="w-full px-[18px] py-[14px] text-base border border-[#A9A9A9] rounded-xl transition-all duration-300 focus:outline-none focus:border-[#C8102E] focus:ring-4 focus:ring-[#C8102E]/5"
                        />
                        <p className="mt-2 text-xs font-medium text-[#A9A9A9]">
                            Minimum 8 characters for security
                        </p>
                    </div>

                    {error && (
                        <div className="bg-[#FFF1F2] border border-[#C8102E]/10 text-[#C8102E] px-4 py-3.5 rounded-xl text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3.5 rounded-xl text-sm font-bold text-center">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 text-base font-black rounded-[14px] transition-all duration-300 shadow-lg flex items-center justify-center gap-3 ${loading
                                ? "bg-[#A9A9A9] cursor-not-allowed"
                                : "bg-[#C8102E] text-white hover:bg-[#A90D27] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(200,16,46,0.3)] active:translate-y-0"
                            }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                <p className="mt-10 text-center text-[#A9A9A9] font-medium">
                    Already have an account?{" "}
                    <a
                        href="/login"
                        className="text-[#C8102E] font-black border-b-2 border-transparent hover:border-[#C8102E]/30 pb-0.5 transition-all"
                    >
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}
