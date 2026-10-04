"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useTranslations } from "next-intl";
import AuthPageShell from "@@/components/auth/AuthPageShell";
import LegalConsentDialog, {
  type LegalDialogSection,
} from "@@/components/auth/LegalConsentDialog";

const inputClassName =
  "h-[46px] w-full rounded-xl border border-[#ded6cd] bg-white/70 pl-10 pr-11 text-sm text-[#211d19] outline-none transition placeholder:text-[#9b928a] hover:border-[#cfc3b6] focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50";

export default function RegisterPage() {
  const t = useTranslations("register");
  const privacyT = useTranslations("privacy");
  const termsT = useTranslations("terms");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [legalDialog, setLegalDialog] = useState<"privacy" | "terms" | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const privacySections: LegalDialogSection[] = Array.from({ length: 7 }, (_, index) => ({
    title: privacyT(`s${index + 1}Title`),
    body: privacyT(`s${index + 1}Body`),
  }));
  const termsSections: LegalDialogSection[] = Array.from({ length: 8 }, (_, index) => ({
    title: termsT(`s${index + 1}Title`),
    body: termsT(`s${index + 1}Body`),
  }));
  const activeLegal = legalDialog === "privacy"
    ? {
        title: privacyT("title"),
        subtitle: privacyT("subtitle"),
        lastUpdated: privacyT("lastUpdated"),
        sections: privacySections,
      }
    : {
        title: termsT("title"),
        subtitle: termsT("subtitle"),
        lastUpdated: termsT("lastUpdated"),
        sections: termsSections,
      };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setConfirmError(t("passwordMismatch"));
      return;
    }

    setConfirmError("");
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
        setError(data.error || t("registrationFailed"));
      } else {
        setSuccess(data.message || t("registrationSuccessful"));
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      }
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError(t("googleError"));
      setGoogleLoading(false);
    }
  }

  return (
    <AuthPageShell>
      <div className="mb-5 text-center">
        <h1 className="text-[1.875rem] font-bold tracking-[-0.035em] text-[#171717]">
          {t("createAccount")}
        </h1>
        <p className="mt-1 text-sm text-[#776e66] sm:text-[0.95rem]">{t("subtitle")}</p>
      </div>

      {error ? (
        <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50/90 p-3 text-sm text-red-700">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 p-3 text-sm text-emerald-700">
          <CheckCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <label htmlFor="register-email" className="block text-sm font-semibold text-[#2a2521]">{t("email")}</label>
          <div className="group relative">
            <Mail aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8c837b] transition-colors group-focus-within:text-primary" />
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading || googleLoading}
              className={inputClassName}
              placeholder={t("emailPlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-password" className="block text-sm font-semibold text-[#2a2521]">{t("password")}</label>
          <div className="group relative">
            <Lock aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8c837b] transition-colors group-focus-within:text-primary" />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (confirmError) setConfirmError("");
              }}
              required
              minLength={8}
              disabled={loading || googleLoading}
              aria-describedby="register-password-hint"
              className={inputClassName}
              placeholder={t("passwordPlaceholder")}
            />
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />
          </div>
          <p id="register-password-hint" className="text-xs text-[#847b73]">{t("passwordHint")}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-confirm-password" className="block text-sm font-semibold text-[#2a2521]">{t("confirmPassword")}</label>
          <div className="group relative">
            <Lock aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8c837b] transition-colors group-focus-within:text-primary" />
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (confirmError) setConfirmError("");
              }}
              onBlur={() => {
                if (confirmPassword && password !== confirmPassword) setConfirmError(t("passwordMismatch"));
              }}
              required
              minLength={8}
              disabled={loading || googleLoading}
              aria-invalid={Boolean(confirmError)}
              aria-describedby={confirmError ? "register-confirm-error" : undefined}
              className={`${inputClassName} ${confirmError ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}`}
              placeholder={t("passwordPlaceholder")}
            />
            <PasswordToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((visible) => !visible)}
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />
          </div>
          {confirmError ? <p id="register-confirm-error" className="text-xs font-medium text-red-600">{confirmError}</p> : null}
        </div>

        <div className="space-y-2 pt-0.5">
          <ConsentRow id="privacy-consent" label={t("privacyConsentLabel")} disabled={loading || googleLoading}>
            {t.rich("privacyConsent", {
              privacy: (chunks) => (
                <button type="button" onClick={() => setLegalDialog("privacy")} className="font-semibold text-primary underline decoration-primary/35 underline-offset-2 transition hover:decoration-primary">
                  {chunks}
                </button>
              ),
            })}
          </ConsentRow>

          <ConsentRow id="terms-consent" label={t("termsConsentLabel")} disabled={loading || googleLoading}>
            {t.rich("termsConsent", {
              terms: (chunks) => (
                <button type="button" onClick={() => setLegalDialog("terms")} className="font-semibold text-primary underline decoration-primary/35 underline-offset-2 transition hover:decoration-primary">
                  {chunks}
                </button>
              ),
            })}
          </ConsentRow>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#d71438] px-5 font-semibold text-white shadow-[0_10px_24px_-14px_rgba(200,16,46,0.85)] transition hover:from-[#b40e29] hover:to-[#c8102e] hover:shadow-[0_14px_28px_-16px_rgba(200,16,46,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none active:scale-[0.99]"
        >
          {loading ? (
            <><Loader2 aria-hidden="true" className="size-4 animate-spin" /><span>{t("creatingAccount")}</span></>
          ) : (
            <><span>{t("createAccount")}</span><ArrowRight aria-hidden="true" className="size-4" /></>
          )}
        </button>
      </form>

      <Divider label={t("orContinueWith")} />

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#ded6cd] bg-white/80 px-4 text-sm font-medium text-[#403a35] transition hover:border-[#cfc3b6] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-65 active:scale-[0.99]"
      >
        {googleLoading ? (
          <><Loader2 aria-hidden="true" className="size-4 animate-spin text-[#746c64]" /><span>{t("connecting")}</span></>
        ) : (
          <><GoogleIcon /><span>{t("signUpWithGoogle")}</span></>
        )}
      </button>

      <p className="mt-4 text-center text-sm text-[#716961]">
        {t("hasAccount")} {" "}
        <Link href="/login" className="font-semibold text-primary transition hover:text-primary/80 hover:underline">{t("signIn")}</Link>
      </p>

      <LegalConsentDialog
        open={legalDialog !== null}
        onOpenChange={(open) => {
          if (!open) setLegalDialog(null);
        }}
        title={activeLegal.title}
        subtitle={activeLegal.subtitle}
        lastUpdated={activeLegal.lastUpdated}
        closeLabel={t("closeLegalDialog")}
        sections={activeLegal.sections}
      />
    </AuthPageShell>
  );
}

function PasswordToggle({ visible, onToggle, showLabel, hideLabel }: { visible: boolean; onToggle: () => void; showLabel: string; hideLabel: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? hideLabel : showLabel}
      className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#817970] transition hover:bg-[#f3ece3] hover:text-[#332a23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
    </button>
  );
}

function ConsentRow({ id, label, disabled, children }: { id: string; label: string; disabled: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        required
        disabled={disabled}
        aria-label={label}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-[#bdb3aa] accent-[#C8102E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />
      <p className="text-xs leading-5 text-[#6f675f]">{children}</p>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3 text-[0.68rem] font-medium uppercase tracking-wide text-[#958b82]">
      <span className="h-px flex-1 bg-[#e5dcd2]" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-[#e5dcd2]" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
