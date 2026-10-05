"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@@/components/ui/button";
import { cn } from "@@/lib/utils";

interface PasswordSectionProps {
  hasPassword: boolean;
  onPasswordSet?: () => void;
}

type Mode = "idle" | "set" | "change";

function StrengthBar({ password }: { password: string }) {
  const t = useTranslations("profile");
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  const barColor =
    score <= 1
      ? "bg-red-400"
      : score === 2
        ? "bg-orange-400"
        : score === 3
          ? "bg-yellow-400"
          : "bg-emerald-500";
  const label =
    score <= 1
      ? t("passwordStrengthWeak")
      : score === 2
        ? t("passwordStrengthFair")
        : score === 3
          ? t("passwordStrengthGood")
          : t("passwordStrengthStrong");
  const labelColor =
    score <= 1
      ? "text-red-400"
      : score === 2
        ? "text-orange-400"
        : score === 3
          ? "text-yellow-500"
          : "text-emerald-500";

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < score ? barColor : "bg-gray-200",
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-bold", labelColor)}>{label}</p>
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  disabled,
  placeholder = "••••••••",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="new-password"
        className="h-12 w-full rounded-xl border border-[#e8e2dc] bg-[#fbfaf8] pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-[#ddd4cc] focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

export default function PasswordSection({
  hasPassword,
  onPasswordSet,
}: PasswordSectionProps) {
  const t = useTranslations("profile");

  const [mode, setMode] = useState<Mode>("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const resetForm = () => {
    setMode("idle");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("passwordMismatch") });
      return;
    }

    const endpoint =
      mode === "set"
        ? "/api/profile/set-password"
        : "/api/profile/change-password";

    const body =
      mode === "set"
        ? { newPassword, confirmPassword }
        : { currentPassword, newPassword, confirmPassword };

    setIsLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        const successText =
          mode === "set" ? t("setPasswordSuccess") : t("changePasswordSuccess");
        setMessage({ type: "success", text: successText });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onPasswordSet?.();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: t("failedToUpdate") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="security"
      className="scroll-mt-24 overflow-hidden rounded-[20px] border border-[#eee8e2] bg-white shadow-[0_10px_28px_rgba(57,42,31,0.05)] h-full flex-col justify-between sm:flex"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary">
            <KeyRound className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
              {t("passwordSecurity")}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {hasPassword ? t("changePasswordDesc") : t("setPasswordDesc")}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-bold",
            hasPassword
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-orange-50 text-orange-500 border-orange-100",
          )}
        >
          {hasPassword ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("passwordSet")}
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              {t("noPassword")}
            </>
          )}
        </span>
      </div>

      {/* Expanded form */}
      {mode !== "idle" && (
        <>
          <div className="border-t border-[#f0ebe6]" />
          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            {/* Status message */}
            {message && (
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium border animate-in fade-in slide-in-from-top-2",
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-red-50 text-red-600 border-red-100",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
                    message.type === "success"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600",
                  )}
                >
                  {message.type === "success" ? "✓" : "!"}
                </span>
                {message.text}
              </div>
            )}

            {/* Current password — change mode only */}
            {mode === "change" && (
              <div>
                <label htmlFor="currentPassword" className={labelClass}>
                  {t("currentPassword")}
                </label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* New password */}
            <div>
              <label htmlFor="newPassword" className={labelClass}>
                {t("newPassword")}
              </label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={setNewPassword}
                disabled={isLoading}
              />
              <StrengthBar password={newPassword} />
              <p className="mt-1.5 text-xs text-gray-400 font-medium">
                {t("passwordHint")}
              </p>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                {t("confirmPassword")}
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                disabled={isLoading}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">
                  {t("passwordMismatch")}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
                className="h-11 w-full rounded-xl border-[#e5ded7] font-semibold text-slate-600 hover:bg-[#f5f1ed] sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full gap-2 rounded-xl bg-primary px-5 font-semibold shadow-[0_8px_18px_rgba(200,16,46,0.18)] hover:bg-destructive disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none sm:w-auto"
              >
                {isLoading && (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                {isLoading
                  ? t("saving")
                  : mode === "set"
                    ? t("setPassword")
                    : t("changePassword")}
              </Button>
            </div>
          </form>
        </>
      )}

      {/* Open button — idle state */}
      {mode === "idle" && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 flex justify-end">
          <Button
            onClick={() => {
              setMessage(null);
              setMode(hasPassword ? "change" : "set");
            }}
            className="h-11 w-full rounded-xl bg-primary px-5 font-semibold shadow-[0_8px_18px_rgba(200,16,46,0.18)] transition hover:bg-destructive sm:w-auto"
          >
            {hasPassword ? t("changePassword") : t("setPassword")}
          </Button>
        </div>
      )}
    </section>
  );
}
