"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Mail, Phone, Calendar, User } from "lucide-react";
import AvatarUpload from "./AvatarUpload";
import PasswordSection from "./PasswordSection";
import { Button } from "@@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@@/components/ui/select";
import { cn } from "@@/lib/utils";

interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    image: string | null;
    phone: string | null;
    birthdate: string | null;
    role: string;
    hasPassword: boolean;
}

const COUNTRY_CODES = [
    { code: "+90",  label: "🇹🇷 +90"  },
    { code: "+1",   label: "🇺🇸 +1"   },
    { code: "+44",  label: "🇬🇧 +44"  },
    { code: "+49",  label: "🇩🇪 +49"  },
    { code: "+33",  label: "🇫🇷 +33"  },
    { code: "+31",  label: "🇳🇱 +31"  },
    { code: "+32",  label: "🇧🇪 +32"  },
    { code: "+43",  label: "🇦🇹 +43"  },
    { code: "+41",  label: "🇨🇭 +41"  },
    { code: "+34",  label: "🇪🇸 +34"  },
    { code: "+39",  label: "🇮🇹 +39"  },
    { code: "+48",  label: "🇵🇱 +48"  },
    { code: "+994", label: "🇦🇿 +994" },
    { code: "+995", label: "🇬🇪 +995" },
    { code: "+380", label: "🇺🇦 +380" },
    { code: "+7",   label: "🇷🇺 +7"   },
    { code: "+966", label: "🇸🇦 +966" },
    { code: "+971", label: "🇦🇪 +971" },
    { code: "+20",  label: "🇪🇬 +20"  },
    { code: "+91",  label: "🇮🇳 +91"  },
    { code: "+86",  label: "🇨🇳 +86"  },
    { code: "+81",  label: "🇯🇵 +81"  },
    { code: "+82",  label: "🇰🇷 +82"  },
    { code: "+61",  label: "🇦🇺 +61"  },
    { code: "+55",  label: "🇧🇷 +55"  },
    { code: "+52",  label: "🇲🇽 +52"  },
];

function parsePhone(fullPhone: string): { code: string; local: string } {
    if (!fullPhone) return { code: "+90", local: "" };
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const { code } of sorted) {
        if (fullPhone.startsWith(code)) {
            return { code, local: fullPhone.slice(code.length).trim() };
        }
    }
    return { code: "+90", local: fullPhone };
}

const labelClass = "text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block";
const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium placeholder:text-gray-400 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100";

export default function ProfileContent() {
    const [user, setUser] = useState<User | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [countryCode, setCountryCode] = useState("+90");
    const [phoneLocal, setPhoneLocal] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const router = useRouter();
    const t = useTranslations("profile");

    const fetchProfile = useCallback(async () => {
        try {
            const response = await fetch("/api/profile");
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setFirstName(data.user.firstName || "");
                setLastName(data.user.lastName || "");
                const parsed = parsePhone(data.user.phone || "");
                setCountryCode(parsed.code);
                setPhoneLocal(parsed.local);
                setBirthdate(data.user.birthdate ? data.user.birthdate.split("T")[0] : "");
            } else {
                setMessage({ type: "error", text: t("failedToLoadShort") });
            }
        } catch {
            setMessage({ type: "error", text: t("failedToLoadShort") });
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone: phoneLocal ? `${countryCode}${phoneLocal}` : "",
                    birthdate: birthdate || null,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                setMessage({ type: "success", text: t("updatedSuccess") });
                router.refresh();
            } else {
                setMessage({ type: "error", text: data.error || t("failedToUpdate") });
            }
        } catch {
            setMessage({ type: "error", text: t("failedToUpdate") });
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = () => {
        if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return "U";
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <span className="w-8 h-8 rounded-full border-[3px] border-gray-200 border-t-primary animate-spin" />
                <p className="text-sm font-medium">{t("loading")}</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-gray-400">{t("failedToLoad")}</p>
            </div>
        );
    }

    return (
        <div className="max-w-200 mx-auto space-y-5">

            {/* ── Profile Header ── */}
            <div className="relative overflow-hidden rounded-3xl shadow-lg">
                <div className="absolute inset-0 bg-linear-to-br from-red-500 via-red-700 to-rose-900" />
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-rose-400/10 blur-2xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-center gap-5 sm:gap-7 p-6 sm:p-8 text-white text-center sm:text-left">
                    <div className="shrink-0">
                        {(user.avatar || user.image) && !imageError ? (
                            <Image
                                src={user.avatar || user.image || ""}
                                alt="Avatar"
                                width={88}
                                height={88}
                                className="w-22 h-22 rounded-full object-cover ring-4 ring-white/25 shadow-xl"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="w-22 h-22 rounded-full bg-linear-to-br from-red-400 to-rose-700 ring-4 ring-white/25 shadow-xl flex items-center justify-center">
                                <span className="text-3xl font-bold drop-shadow">{getInitials()}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1 truncate drop-shadow-sm">
                            {firstName && lastName ? `${firstName} ${lastName}` : user.email.split("@")[0]}
                        </h2>
                        <p className="text-sm text-white/70 mb-3 break-all">{user.email}</p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-black uppercase tracking-widest">
                            {user.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Avatar Upload ── */}
            <AvatarUpload
                currentAvatar={user.avatar || user.image || null}
                userId={user.id}
                onSuccess={fetchProfile}
            />

            {/* ── Status Message ── */}
            {message && (
                <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium border animate-in fade-in slide-in-from-top-2",
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
                    {message.text}
                </div>
            )}

            {/* ── Personal Info Form ── */}
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-5">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("personalInfo")}</h3>

                    {/* Email */}
                    <div>
                        <label className={labelClass}>{t("emailAddress")}</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className={cn(inputClass, "pl-10")}
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-400 font-medium">{t("emailCannotChange")}</p>
                    </div>

                    {/* First + Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="firstName" className={labelClass}>
                                {t("firstName")} <span className="text-primary">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    maxLength={50}
                                    className={cn(inputClass, "pl-10")}
                                    placeholder={t("firstNamePlaceholder")}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="lastName" className={labelClass}>
                                {t("lastName")} <span className="text-primary">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    maxLength={50}
                                    className={cn(inputClass, "pl-10")}
                                    placeholder={t("lastNamePlaceholder")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Phone + Birthdate */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="phoneLocal" className={labelClass}>{t("phoneNumber")}</label>
                            <div className="flex rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                                <Select value={countryCode} onValueChange={setCountryCode}>
                                    <SelectTrigger className="w-27 shrink-0 h-full rounded-none border-0 border-r border-gray-200 bg-transparent focus:ring-0 focus:ring-offset-0 text-xs font-bold px-2 py-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 bg-white border border-gray-200 shadow-lg">
                                        {COUNTRY_CODES.map(({ code, label }) => (
                                            <SelectItem key={code} value={code} className="text-xs">
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="relative flex-1">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        id="phoneLocal"
                                        value={phoneLocal}
                                        onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d\s\-()]/g, ""))}
                                        maxLength={15}
                                        className="w-full pl-9 pr-3 py-3 text-sm font-medium bg-transparent outline-none placeholder:text-gray-400 text-gray-900 min-w-0"
                                        placeholder={t("phonePlaceholder")}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="birthdate" className={labelClass}>{t("birthdate")}</label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    id="birthdate"
                                    value={birthdate}
                                    onChange={(e) => setBirthdate(e.target.value)}
                                    className={cn(inputClass, "pl-10")}
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 sm:px-8 py-5 border-t border-gray-100 bg-gray-50/50">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isSaving}
                        className="w-full sm:w-auto rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full sm:w-auto rounded-xl font-bold bg-primary hover:bg-destructive shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all gap-2 disabled:opacity-70 disabled:shadow-none"
                    >
                        {isSaving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                        {isSaving ? t("saving") : t("saveChanges")}
                    </Button>
                </div>
            </form>

            {/* ── Password Management ── */}
            <PasswordSection
                hasPassword={user.hasPassword}
                onPasswordSet={fetchProfile}
            />
        </div>
    );
}
