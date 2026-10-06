import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  ChevronRight,
  CircleHelp,
  Heart,
  KeyRound,
  MapPin,
  Settings2,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { auth } from "@@/lib/auth-helper";
import ProfileContent from "./ProfileContent";

const ROUTE_LINKS = [
  { href: "/profile", key: "profile", icon: UserRound, active: true },
  { href: "/orders", key: "orders", icon: ShoppingBag, active: false },
  { href: "/wishlist", key: "wishlist", icon: Heart, active: false },
  { href: "/profile/addresses", key: "addresses", icon: MapPin, active: false },
] as const;

const SECTION_LINKS = [
  { href: "#security", key: "security", icon: KeyRound },
  { href: "#account-preferences", key: "preferences", icon: Settings2 },
] as const;

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/profile");
  }

  const t = await getTranslations("profile");

  return (
    <div className="bg-[linear-gradient(180deg,#fbfaf8_0%,#ffffff_34%)]">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden h-fit rounded-[20px] border border-[#eee8e2] bg-white p-4 shadow-[0_10px_28px_rgba(57,42,31,0.05)] lg:sticky lg:top-24 lg:block">
            <nav aria-label={t("accountNavigation")}>
              <ul className="space-y-1">
                {ROUTE_LINKS.map(({ href, key, icon: Icon, active }) => (
                  <li key={key}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "flex min-h-12 items-center gap-3 rounded-xl bg-red-50 px-3.5 text-sm font-semibold text-primary"
                          : "group flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-[#faf7f4] hover:text-slate-950"
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                      <span className="flex-1">{t(`navigation.${key}`)}</span>
                      {!active && (
                        <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-4 h-px bg-[#f0ebe6]" />
              <p className="px-3.5 pb-2 text-xs font-semibold text-slate-400">
                {t("accountSettings")}
              </p>
              <ul className="space-y-1">
                {SECTION_LINKS.map(({ href, key, icon: Icon }) => (
                  <li key={key}>
                    <Link
                      href={href}
                      className="group flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-[#faf7f4] hover:text-slate-950"
                    >
                      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                      <span className="flex-1">{t(`navigation.${key}`)}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-5 rounded-2xl bg-[linear-gradient(135deg,#fbf5ee,#f7efe5)] p-4">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#7a5940] shadow-sm">
                  <CircleHelp className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {t("support.title")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {t("support.description")}
                  </p>
                </div>
              </div>
              <Link
                href="/contact"
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                {t("support.action")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>

          <main className="min-w-0">
            <nav
              className="mb-3 hidden items-center gap-1.5 text-xs text-slate-400 sm:flex"
              aria-label={t("breadcrumbLabel")}
            >
              <Link href="/" className="transition hover:text-primary">
                {t("home")}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-slate-600">
                {t("myProfile")}
              </span>
            </nav>
            <div className="mb-5">
              <h1 className="text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[2rem]">
                {t("myProfile")}
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-[15px]">
                {t("pageDescription")}
              </p>
            </div>
            <ProfileContent />
          </main>
        </div>
      </div>
    </div>
  );
}
