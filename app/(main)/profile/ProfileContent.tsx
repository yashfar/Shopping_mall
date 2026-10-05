"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Calendar,
  ChevronRight,
  Heart,
  Mail,
  MapPin,
  Phone,
  Settings2,
  ShoppingBag,
  User,
  UserRound,
} from "lucide-react";
import AvatarUpload from "./AvatarUpload";
import PasswordSection from "./PasswordSection";
import CurrencySwitcher from "@@/components/CurrencySwitcher";
import LanguageSwitcher from "@@/components/LanguageSwitcher";
import { Button } from "@@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@@/components/ui/select";
import { cn } from "@@/lib/utils";

interface ProfileUser {
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
  { code: "+90", label: "🇹🇷 +90" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+31", label: "🇳🇱 +31" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+43", label: "🇦🇹 +43" },
  { code: "+41", label: "🇨🇭 +41" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+39", label: "🇮🇹 +39" },
  { code: "+48", label: "🇵🇱 +48" },
  { code: "+994", label: "🇦🇿 +994" },
  { code: "+995", label: "🇬🇪 +995" },
  { code: "+380", label: "🇺🇦 +380" },
  { code: "+7", label: "🇷🇺 +7" },
  { code: "+966", label: "🇸🇦 +966" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+20", label: "🇪🇬 +20" },
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+81", label: "🇯🇵 +81" },
  { code: "+82", label: "🇰🇷 +82" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+55", label: "🇧🇷 +55" },
  { code: "+52", label: "🇲🇽 +52" },
];

function parsePhone(fullPhone: string): { code: string; local: string } {
  if (!fullPhone) return { code: "+90", local: "" };
  const sorted = [...COUNTRY_CODES].sort(
    (a, b) => b.code.length - a.code.length,
  );
  for (const { code } of sorted) {
    if (fullPhone.startsWith(code)) {
      return { code, local: fullPhone.slice(code.length).trim() };
    }
  }
  return { code: "+90", local: fullPhone };
}

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";
const inputClass =
  "h-12 w-full rounded-xl border border-[#e8e2dc] bg-[#fbfaf8] px-4 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-[#ddd4cc] focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-[#f4f2ef] disabled:text-slate-500";

const QUICK_LINKS = [
  { href: "/profile/addresses", key: "addresses", icon: MapPin },
  { href: "/orders", key: "orders", icon: ShoppingBag },
  { href: "/wishlist", key: "wishlist", icon: Heart },
] as const;

export default function ProfileContent() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("+90");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
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
        setBirthdate(
          data.user.birthdate ? data.user.birthdate.split("T")[0] : "",
        );
      } else {
        setMessage({ type: "error", text: t("failedToLoadShort") });
      }
    } catch {
      setMessage({ type: "error", text: t("failedToLoadShort") });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    if (firstName && lastName)
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-slate-400">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-primary" />
        <p className="text-sm font-medium">{t("loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-red-100 bg-red-50/70 p-6">
        <p className="text-sm font-medium text-red-600">{t("failedToLoad")}</p>
      </div>
    );
  }

  const avatar = user.avatar || user.image || null;
  const displayName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : user.email.split("@")[0];

  return (
    <div className="min-w-0 space-y-5">
      <section
        className="relative overflow-hidden rounded-[22px] bg-cover bg-center text-white shadow-[0_14px_34px_rgba(153,0,28,0.18)]"
        style={{
          backgroundImage: "url('/images/profile/profile-hero-bg.png')",
        }}
        aria-labelledby="profile-summary-title"
      >
        <div className="absolute inset-0 bg-black/8" />
        <div className="relative flex flex-col items-center gap-5 px-5 py-6 text-center sm:px-7 sm:py-7 lg:flex-row lg:gap-6 lg:text-left">
          <div className="relative shrink-0">
            {avatar && !imageError ? (
              <Image
                src={avatar}
                alt={displayName}
                width={104}
                height={104}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-white/35 shadow-xl sm:h-25 sm:w-25"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#9b817d] text-3xl font-semibold ring-4 ring-white/35 shadow-xl sm:h-25 sm:w-25">
                {getInitials()}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#cf0a2c] bg-white text-primary shadow-md"
              aria-hidden="true"
            >
              <UserRound className="h-4 w-4" strokeWidth={2.2} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="profile-summary-title"
              className="truncate text-2xl font-bold tracking-[-0.025em] sm:text-[1.7rem]"
            >
              {displayName}
            </h2>
            <p className="mt-1 break-all text-sm text-white/85">{user.email}</p>
            <span className="mt-3 inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-sm">
              {user.role}
            </span>
          </div>

          <AvatarUpload currentAvatar={avatar} onSuccess={fetchProfile} />
        </div>
      </section>

      {message && (
        <div
          role="status"
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
            message.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-red-100 bg-red-50 text-red-600",
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black",
              message.type === "success" ? "bg-emerald-100" : "bg-red-100",
            )}
          >
            {message.type === "success" ? "✓" : "!"}
          </span>
          {message.text}
        </div>
      )}

      <form
        id="personal-information"
        onSubmit={handleSubmit}
        className="scroll-mt-24 overflow-hidden rounded-[20px] border border-[#eee8e2] bg-white shadow-[0_10px_28px_rgba(57,42,31,0.05)]"
      >
        <div className="space-y-5 p-5 sm:p-6 lg:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary">
              <UserRound className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                {t("personalInfo")}
              </h3>
              <p className="mt-0.5 text-xs md:text-sm text-slate-500">
                {t("personalInfoDescription")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className={labelClass}>
                {t("firstName")} <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
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
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  maxLength={50}
                  className={cn(inputClass, "pl-10")}
                  placeholder={t("lastNamePlaceholder")}
                />
              </div>
            </div>
            <div>
              <label htmlFor="profileEmail" className={labelClass}>
                {t("emailAddress")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="profileEmail"
                  type="email"
                  value={user.email}
                  disabled
                  className={cn(inputClass, "pl-10")}
                />
              </div>
              <p className="mt-1.5 text-xs font-medium text-slate-400">
                {t("emailCannotChange")}
              </p>
            </div>
            <div>
              <label htmlFor="phoneLocal" className={labelClass}>
                {t("phoneNumber")}
              </label>
              <div className="flex h-12 overflow-hidden rounded-xl border border-[#e8e2dc] bg-[#fbfaf8] transition-colors hover:border-[#ddd4cc] focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="h-full w-28 shrink-0 rounded-none border-0 border-r border-[#e8e2dc] bg-transparent px-2 text-xs font-bold focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 border-[#e8e2dc] bg-white shadow-lg">
                    {COUNTRY_CODES.map(({ code, label }) => (
                      <SelectItem key={code} value={code} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative min-w-0 flex-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="phoneLocal"
                    type="tel"
                    value={phoneLocal}
                    onChange={(event) =>
                      setPhoneLocal(
                        event.target.value.replace(/[^\d\s\-()]/g, ""),
                      )
                    }
                    maxLength={15}
                    className="h-full w-full min-w-0 bg-transparent pl-9 pr-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder={t("phonePlaceholder")}
                  />
                </div>
              </div>
            </div>
            <div className="sm:col-start-2">
              <label htmlFor="birthdate" className={labelClass}>
                {t("birthdate")}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="birthdate"
                  type="date"
                  value={birthdate}
                  onChange={(event) => setBirthdate(event.target.value)}
                  className={cn(inputClass, "pl-10")}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-[#f0ebe6] bg-[#fdfcfb] px-5 py-4 sm:flex-row sm:px-6 lg:px-7">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
            className="h-11 w-full rounded-xl border-[#e5ded7] font-semibold text-slate-600 hover:bg-[#f5f1ed] sm:w-auto"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="h-11 w-full gap-2 rounded-xl bg-primary px-5 font-semibold shadow-[0_8px_18px_rgba(200,16,46,0.18)] hover:bg-destructive disabled:shadow-none sm:w-auto"
          >
            {isSaving && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {isSaving ? t("saving") : t("saveChanges")}
          </Button>
        </div>
      </form>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
        <PasswordSection
          hasPassword={user.hasPassword}
          onPasswordSet={fetchProfile}
        />

        <section
          id="account-preferences"
          className="scroll-mt-24 rounded-[20px] border border-[#eee8e2] bg-white p-5 shadow-[0_10px_28px_rgba(57,42,31,0.05)] sm:p-6"
          aria-labelledby="preferences-title"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary">
              <Settings2 className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h3
                id="preferences-title"
                className="text-lg font-bold tracking-[-0.02em] text-slate-950"
              >
                {t("accountPreferences")}
              </h3>
              <p className="mt-0.5 break-words text-sm leading-5 text-slate-500">
                {t("accountPreferencesDescription")}
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-[#f0ebe6]">
            <div className="flex min-h-16  gap-3 py-3 flex-row items-center justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {t("language")}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("languageDescription")}
                </p>
              </div>
              <div className="self-end sm:self-auto">
                <LanguageSwitcher />
              </div>
            </div>
            <div className="flex min-h-16  gap-3 py-3 flex-row items-center justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {t("currency")}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t("currencyDescription")}
                </p>
              </div>
              <div className="self-end sm:self-auto">
                <CurrencySwitcher />
              </div>
            </div>
          </div>
        </section>
      </div>

      <nav
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        aria-label={t("quickLinksLabel")}
      >
        {QUICK_LINKS.map(({ href, key, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className="group flex min-h-21 items-center gap-3 rounded-2xl border border-[#eee8e2] bg-white p-4 shadow-[0_8px_22px_rgba(57,42,31,0.04)] transition hover:-translate-y-0.5 hover:border-red-100 hover:shadow-[0_10px_26px_rgba(57,42,31,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-950">
                {t(`quickLinks.${key}.title`)}
              </span>
              <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                {t(`quickLinks.${key}.description`)}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
