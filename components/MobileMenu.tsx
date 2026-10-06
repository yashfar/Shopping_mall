"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Coins,
  Grid2X2,
  Globe2,
  Heart,
  House,
  LayoutDashboard,
  Layers3,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Package,
  ShoppingBag,
  User,
} from "lucide-react";
import CurrencySwitcher from "@@/components/CurrencySwitcher";
import LanguageSwitcher from "@@/components/LanguageSwitcher";
import { Button } from "@@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@@/components/ui/sheet";

interface Category {
  id: string;
  name: string;
}

interface MobileMenuProps {
  categories: Category[];
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  } | null;
}

export default function MobileMenu({ categories, user }: MobileMenuProps) {
  const t = useTranslations("mobileMenu");
  const userT = useTranslations("userMenu");
  const [open, setOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [imageError, setImageError] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";
  const handleNavigation = () => setOpen(false);

  const userName = user?.name || user?.email?.split("@")[0] || t("user");
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      setOpen(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const navigationClass = (active: boolean) =>
    `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/20 ${
      active
        ? "bg-[#fff0f1] text-[#C8102E]"
        : "text-[#302b27] hover:bg-[#f8f3ed] hover:text-[#C8102E]"
    }`;

  if (!user) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-[#C9B99A] md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="flex h-full min-h-0 w-[calc(100vw-1rem)] max-w-96 flex-col overflow-hidden bg-white p-0"
        >
          <SheetHeader className="shrink-0 border-b border-gray-100 bg-gray-50/30 p-4">
            <SheetTitle className="text-left text-lg font-bold text-[#1A1A1A]">{t("menu")}</SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto py-4">
            <nav className="flex flex-col gap-2 px-4">
              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={handleNavigation}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${pathname === "/" ? "bg-[#C8102E]/10 text-[#C8102E]" : "text-[#1A1A1A] hover:bg-gray-100"}`}
                >
                  {t("home")}
                </Link>
                <Link
                  href="/products"
                  onClick={handleNavigation}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${pathname === "/products" ? "bg-[#C8102E]/10 text-[#C8102E]" : "text-[#1A1A1A] hover:bg-gray-100"}`}
                >
                  {t("products")}
                </Link>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setIsCategoriesOpen((current) => !current)}
                  className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-gray-100"
                  aria-expanded={isCategoriesOpen}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 transition-colors group-hover:text-[#1A1A1A]">
                    {t("categories")}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isCategoriesOpen ? "rotate-180 text-[#C8102E]" : ""}`} />
                </button>
                <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isCategoriesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/products?category=${encodeURIComponent(category.name)}`}
                      onClick={handleNavigation}
                      className="block rounded-md px-3 py-2 pl-6 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#C8102E]"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 pb-[env(safe-area-inset-bottom)]">
            <div className="space-y-2 border-b border-gray-100 px-4 py-3">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">{t("language")}</span>
                <div className="shrink-0"><LanguageSwitcher /></div>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">{t("currency")}</span>
                <div className="shrink-0"><CurrencySwitcher /></div>
              </div>
            </div>
            <div className="grid gap-2 p-4">
              <Button asChild className="w-full bg-[#C8102E] text-white hover:bg-[#A90D27]">
                <Link href="/login" onClick={handleNavigation}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {t("signIn")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register" onClick={handleNavigation}>{t("createAccount")}</Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-[#9e825e] md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-full min-h-0 max-w-sm flex-col overflow-hidden border-l border-[#eadfd3] bg-[#fffdfa] p-0"
        style={{ width: "min(88vw, 360px)" }}
      >
        <SheetHeader className="shrink-0 border-b border-[#eee5dc] bg-white/70 px-5 py-4">
          <SheetTitle className="text-left text-lg font-bold text-[#24201d]">{t("menu")}</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <nav className="space-y-1" aria-label={t("menu")}>
            <Link href="/" onClick={handleNavigation} className={navigationClass(pathname === "/")}>
              <House className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {t("home")}
            </Link>
            <Link href="/products" onClick={handleNavigation} className={navigationClass(pathname === "/products")}>
              <Grid2X2 className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {t("products")}
            </Link>

            <button
              type="button"
              onClick={() => setIsCategoriesOpen((current) => !current)}
              aria-expanded={isCategoriesOpen}
              className={`${navigationClass(false)} w-full justify-between`}
            >
              <span className="flex items-center gap-3">
                <Layers3 className="h-[18px] w-[18px]" strokeWidth={1.7} />
                <span>{t("categories")}</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-[#8f867e] transition-transform ${isCategoriesOpen ? "rotate-180 text-[#C8102E]" : ""}`} />
            </button>

            <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isCategoriesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  onClick={handleNavigation}
                  className="block rounded-xl py-2 pl-12 pr-3 text-sm text-[#6f6760] transition hover:bg-[#f8f3ed] hover:text-[#C8102E]"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </nav>

          <div className="my-4 h-px bg-[#eee5dc]" />
              <section aria-labelledby="mobile-account-heading">
                <h2 id="mobile-account-heading" className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#9a9087]">
                  {t("account")}
                </h2>

                <div className="mb-2 flex items-center gap-3 rounded-2xl bg-[#f8f3ed] px-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#C8102E] text-xs font-bold text-white">
                    {user.image && !imageError ? (
                      <Image
                        src={user.image}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-full w-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      initials
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#24201d]">{userName}</p>
                    <p className="mt-0.5 truncate text-xs text-[#847b73]">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  {[
                    { href: "/profile", label: userT("profile"), icon: User },
                    { href: "/orders", label: userT("orders"), icon: ShoppingBag },
                    { href: "/wishlist", label: userT("wishlist"), icon: Heart },
                    { href: "/profile/addresses", label: userT("addresses"), icon: MapPin },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={handleNavigation} className={navigationClass(pathname === href)}>
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                      {label}
                    </Link>
                  ))}
                </div>
              </section>

              {isAdmin && (
                <section className="mt-3 space-y-1">
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#C8102E]">{t("adminPanel")}</p>
                  <Link href="/admin" onClick={handleNavigation} className={navigationClass(pathname === "/admin")}>
                    <LayoutDashboard className="h-[18px] w-[18px]" strokeWidth={1.7} />
                    {t("admin")}
                  </Link>
                  <Link href="/admin/products" onClick={handleNavigation} className={navigationClass(pathname.startsWith("/admin/products"))}>
                    <Package className="h-[18px] w-[18px]" strokeWidth={1.7} />
                    {t("products")}
                  </Link>
                </section>
              )}

              <div className="my-4 h-px bg-[#eee5dc]" />
              <section aria-labelledby="mobile-preferences-heading">
                <h2 id="mobile-preferences-heading" className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#9a9087]">
                  {t("preferences")}
                </h2>
                <div className="space-y-1">
                  <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3">
                    <span className="flex items-center gap-3 text-sm font-medium text-[#302b27]">
                      <Globe2 className="h-[18px] w-[18px]" strokeWidth={1.7} />
                      {t("language")}
                    </span>
                    <LanguageSwitcher />
                  </div>
                  <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3">
                    <span className="flex items-center gap-3 text-sm font-medium text-[#302b27]">
                      <Coins className="h-[18px] w-[18px]" strokeWidth={1.7} />
                      {t("currency")}
                    </span>
                    <CurrencySwitcher />
                  </div>
                </div>
              </section>

              <div className="my-4 h-px bg-[#eee5dc]" />
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-[#C8102E] transition hover:bg-[#fff0f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/25 disabled:opacity-50"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
                {isLoggingOut ? userT("loggingOut") : userT("logout")}
              </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
