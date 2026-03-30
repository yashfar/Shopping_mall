"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Trash2, Mail, MailOpen } from "lucide-react";

type Message = {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    isRead: boolean;
    createdAt: string;
};

export default function MessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/messages");
            const data = await res.json();
            setMessages(data.messages || []);
        } catch {
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const toggleRead = async (id: string, currentRead: boolean) => {
        setProcessingId(id);
        try {
            await fetch(`/api/admin/messages/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isRead: !currentRead }),
            });
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, isRead: !currentRead } : m))
            );
        } catch {
            toast.error("Failed to update");
        } finally {
            setProcessingId(null);
        }
    };

    const deleteMessage = async (id: string) => {
        setProcessingId(id);
        try {
            await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
            setMessages((prev) => prev.filter((m) => m.id !== id));
            toast.success("Message deleted");
            if (expandedId === id) setExpandedId(null);
        } catch {
            toast.error("Failed to delete");
        } finally {
            setProcessingId(null);
        }
    };

    const handleExpand = async (msg: Message) => {
        if (expandedId === msg.id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(msg.id);
        // Auto mark as read
        if (!msg.isRead) {
            toggleRead(msg.id, false);
        }
    };

    const unreadCount = messages.filter((m) => !m.isRead).length;

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Contact Messages</h1>
                    <p className="text-gray-500 mt-2">
                        {unreadCount > 0
                            ? <span><span className="font-bold text-[#C8102E]">{unreadCount}</span> unread message{unreadCount !== 1 ? "s" : ""}</span>
                            : "All messages read"
                        }
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchMessages} variant="outline" size="icon" title="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Link href="/admin" className="flex items-center text-sm font-medium text-gray-500 hover:text-[#C8102E] transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                        Back to Admin
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8102E]" />
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="bg-gray-50 p-4 rounded-full inline-flex mb-4">
                        <Mail className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1">No messages yet</p>
                    <p className="text-sm text-gray-400">Messages from the contact form will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                                !msg.isRead
                                    ? "border-[#C8102E]/20 shadow-md"
                                    : "border-gray-100"
                            } ${processingId === msg.id ? "opacity-60 pointer-events-none" : ""}`}
                        >
                            {/* Header Row */}
                            <button
                                onClick={() => handleExpand(msg)}
                                className="w-full text-left p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                    !msg.isRead
                                        ? "bg-red-50 border-red-100"
                                        : "bg-gray-50 border-gray-100"
                                }`}>
                                    {msg.isRead
                                        ? <MailOpen className="w-5 h-5 text-gray-400" />
                                        : <Mail className="w-5 h-5 text-[#C8102E]" />
                                    }
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-bold truncate ${!msg.isRead ? "text-gray-900" : "text-gray-600"}`}>
                                            {msg.subject}
                                        </span>
                                        {!msg.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-[#C8102E] shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        <span className="font-semibold text-gray-700">{msg.name}</span> &middot; {msg.email}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {new Date(msg.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </p>
                                </div>
                            </button>

                            {/* Expanded Content */}
                            {expandedId === msg.id && (
                                <div className="border-t border-gray-100 px-5 pb-5">
                                    <div className="bg-gray-50 rounded-xl p-4 mt-4 mb-4">
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}>
                                            <Button size="sm" className="bg-[#C8102E] hover:bg-[#A90D27] text-white font-bold gap-1.5">
                                                <Mail className="w-3.5 h-3.5" />
                                                Reply
                                            </Button>
                                        </a>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => { e.stopPropagation(); toggleRead(msg.id, msg.isRead); }}
                                            className="gap-1.5 font-bold"
                                        >
                                            {msg.isRead ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                                            {msg.isRead ? "Mark Unread" : "Mark Read"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                                            className="gap-1.5 font-bold text-red-500 hover:bg-red-50 hover:border-red-200 ml-auto"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
