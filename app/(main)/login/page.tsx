"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useTranslations } from "next-intl";
import AuthPageShell from "@@/components/auth/AuthPageShell";

const inputClassName =
  "h-[46px] w-full rounded-xl border border-[#ded6cd] bg-white/70 pl-10 pr-11 text-sm text-[#211d19] outline-none transition placeholder:text-[#9b928a] hover:border-[#cfc3b6] focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50";

function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error || !result?.ok) {
        setError(t("invalidCredentials"));
      } else if (result?.ok) {
        router.refresh();
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.location.href = callbackUrl;
      }
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError(t("googleError"));
      setGoogleLoading(false);
    }
  }

  return (
    <AuthPageShell>
      <div className="mb-5 text-center">
        <h1 className="text-[1.875rem] font-bold tracking-[-0.035em] text-[#171717]">
          {t("welcomeBack")}
        </h1>
        <p className="mt-1 text-sm text-[#776e66] sm:text-[0.95rem]">{t("subtitle")}</p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50/90 p-3 text-sm text-red-700"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-sm font-semibold text-[#2a2521]">
            {t("email")}
          </label>
          <div className="group relative">
            <Mail
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8c837b] transition-colors group-focus-within:text-primary"
            />
            <input
              id="login-email"
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
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="login-password" className="text-sm font-semibold text-[#2a2521]">
              {t("password")}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary transition hover:text-primary/80 hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <div className="group relative">
            <Lock
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8c837b] transition-colors group-focus-within:text-primary"
            />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading || googleLoading}
              className={inputClassName}
              placeholder={t("passwordPlaceholder")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#817970] transition hover:bg-[#f3ece3] hover:text-[#332a23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#d71438] px-5 font-semibold text-white shadow-[0_10px_24px_-14px_rgba(200,16,46,0.85)] transition hover:from-[#b40e29] hover:to-[#c8102e] hover:shadow-[0_14px_28px_-16px_rgba(200,16,46,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65 disabled:shadow-none active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              <span>{t("signingIn")}</span>
            </>
          ) : (
            <>
              <span>{t("signIn")}</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </>
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
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin text-[#746c64]" />
            <span>{t("connecting")}</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>{t("signInWithGoogle")}</span>
          </>
        )}
      </button>

      <p className="mt-4 text-center text-sm text-[#716961]">
        {t("noAccount")} {" "}
        <Link
          href="/register"
          className="font-semibold text-primary transition hover:text-primary/80 hover:underline"
        >
          {t("signUp")}
        </Link>
      </p>
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoadingState />}>
      <LoginForm />
    </Suspense>
  );
}

function AuthLoadingState() {
  return (
    <AuthPageShell>
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 aria-label="Loading" className="size-8 animate-spin text-primary" />
      </div>
    </AuthPageShell>
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
