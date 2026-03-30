"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@@/components/ui/button";
import { Send, Loader2, Mail, MessageSquare, User } from "lucide-react";

export default function ContactPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, subject, message }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to send message");
            }

            setSent(true);
            toast.success("Message sent successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to send message");
        } finally {
            setSubmitting(false);
        }
    };

    if (sent) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 md:py-32">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-10 md:p-16 text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-emerald-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-3">Message Sent!</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                        Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                    </p>
                    <Button
                        onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}
                        variant="outline"
                        className="font-bold"
                    >
                        Send Another Message
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* Left — Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Get in Touch</h1>
                        <p className="text-gray-500 mt-3 leading-relaxed">
                            Have a question about your order, a product, or anything else? Send us a message and we&apos;ll get back to you shortly.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                                <Mail className="w-5 h-5 text-[#C8102E]" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-900">Email Us</p>
                                <p className="text-sm text-gray-500 mt-0.5">support@mystore.com</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                                <MessageSquare className="w-5 h-5 text-[#C8102E]" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-900">Response Time</p>
                                <p className="text-sm text-gray-500 mt-0.5">We usually respond within 24 hours</p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Card */}
                    <div className="hidden lg:block bg-[#1A1A1A] rounded-3xl p-6 text-white">
                        <p className="text-sm font-bold mb-2">Need quick help?</p>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Check your order status anytime from your account. For returns and refunds, visit your order details page.
                        </p>
                    </div>
                </div>

                {/* Right — Form */}
                <div className="lg:col-span-3">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 md:p-8 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label htmlFor="name" className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                    Your Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        disabled={submitting}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        required
                                        disabled={submitting}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="subject" className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                Subject
                            </label>
                            <input
                                type="text"
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="How can we help?"
                                required
                                disabled={submitting}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all text-sm font-medium"
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                                Message
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us more about your question or concern..."
                                rows={5}
                                required
                                disabled={submitting}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all text-sm font-medium resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-[#C8102E] hover:bg-[#A90D27] text-white font-bold py-6 rounded-xl shadow-lg shadow-[#C8102E]/20 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Send Message
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
