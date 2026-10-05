"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  CirclePlus,
  Coins,
  Globe2,
  Heart,
  ImageIcon,
  LogOut,
  MapPin,
  Package,
  ShoppingCart,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import CurrencySwitcher from "@@/components/CurrencySwitcher";
import LanguageSwitcher from "@@/components/LanguageSwitcher";
import SearchBar from "@@/components/SearchBar";
import { useCart } from "@@/context/CartContext";
import { useWishlist } from "@@/context/WishlistContext";

interface NavbarClientProps {
  user: {
    email: string;
    role: string;
    avatar?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export default function NavbarClient({ user }: NavbarClientProps) {
  const t = useTranslations("userMenu");
  const { cartCount, isAnimating } = useCart();
  useWishlist();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const emailName = user.email.split("@")[0];
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    emailName.charAt(0).toUpperCase() + emailName.slice(1);
  const triggerName = user.firstName || displayName;
  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((part) => part!.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || user.email.charAt(0).toUpperCase();

  const avatar = (sizeClass: string) => (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#C8102E] text-white`}
      aria-hidden="true"
    >
      {user.avatar && !imageError ? (
        <Image
          src={user.avatar}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-xs font-bold tracking-wide">{initials}</span>
      )}
    </span>
  );

  const accountLinks = [
    { href: "/profile", label: t("profile"), icon: User },
    { href: "/orders", label: t("orders"), icon: Package },
    { href: "/wishlist", label: t("wishlist"), icon: Heart },
    { href: "/profile/addresses", label: t("addresses"), icon: MapPin },
  ];

  return (
    <div className="flex min-w-0 items-center gap-1.5 md:flex-1 md:justify-end md:gap-3 lg:gap-4">
      <div className="hidden min-w-[210px] max-w-[500px] flex-1 md:block">
        <SearchBar />
      </div>

      <Link
        href="/wishlist"
        aria-label={t("wishlist")}
        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#25211d] transition hover:bg-[#f8f1e8] hover:text-[#C8102E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/35 md:flex"
      >
        <Heart className="h-[22px] w-[22px]" strokeWidth={1.7} />
      </Link>

      <Link
        href="/cart"
        aria-label={t("cart")}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#25211d] transition hover:bg-[#f8f1e8] hover:text-[#C8102E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/35"
      >
        <ShoppingCart className={`h-[22px] w-[22px] ${isAnimating ? "animate-cart-bounce" : ""}`} strokeWidth={1.7} />
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#C8102E] px-1 text-[10px] font-bold leading-none text-white shadow-sm">
            {cartCount}
          </span>
        )}
      </Link>

      <Link
        href="/profile"
        aria-label={t("profile")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-[#f8f1e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/35 md:hidden"
      >
        {avatar("h-8 w-8")}
      </Link>

      <div className="relative hidden md:block" ref={dropdownRef}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsDropdownOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
          aria-controls="desktop-account-menu"
          className="flex h-10 items-center gap-2 rounded-full px-1.5 pr-2 text-[#25211d] transition hover:bg-[#f8f1e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/35"
        >
          {avatar("h-8 w-8")}
          <span className="max-w-24 truncate text-sm font-semibold">{triggerName}</span>
          <ChevronDown className={`h-4 w-4 text-[#8e847a] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {isDropdownOpen && (
          <div
            id="desktop-account-menu"
            role="menu"
            className="dropdown-menu absolute right-0 top-[calc(100%+0.7rem)] z-[1000] w-[304px] overflow-hidden rounded-[18px] border border-[#eadfd3] bg-[#fffdfa] p-2 shadow-[0_18px_50px_rgba(67,49,31,0.16)]"
          >
            <div className="flex items-center gap-3 px-3 py-3">
              {avatar("h-11 w-11")}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#24201d]">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-[#847b73]">{user.email}</p>
              </div>
            </div>

            <div className="my-1 h-px bg-[#eee5dc]" />
            <div className="py-1">
              {accountLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#302b27] transition hover:bg-[#f8f1e8] hover:text-[#C8102E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/25"
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  {label}
                </Link>
              ))}

              {user.role === "ADMIN" && (
                <>
                  <Link href="/admin/products" role="menuitem" onClick={() => setIsDropdownOpen(false)} className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#302b27] transition hover:bg-[#f8f1e8] hover:text-[#C8102E]">
                    <CirclePlus className="h-[18px] w-[18px]" strokeWidth={1.7} />
                    {t("addProduct")}
                  </Link>
                  <Link href="/admin/banners" role="menuitem" onClick={() => setIsDropdownOpen(false)} className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#302b27] transition hover:bg-[#f8f1e8] hover:text-[#C8102E]">
                    <ImageIcon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                    {t("banners")}
                  </Link>
                </>
              )}
            </div>

            <div className="my-1 h-px bg-[#eee5dc]" />
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9a9087]">
              {t("preferences")}
            </p>
            <div className="space-y-1 pb-1">
              <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3">
                <span className="flex items-center gap-2.5 text-sm font-medium text-[#302b27]">
                  <Globe2 className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  {t("language")}
                </span>
                <LanguageSwitcher />
              </div>
              <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3">
                <span className="flex items-center gap-2.5 text-sm font-medium text-[#302b27]">
                  <Coins className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  {t("currency")}
                </span>
                <CurrencySwitcher />
              </div>
            </div>

            <div className="my-1 h-px bg-[#eee5dc]" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-[#C8102E] transition hover:bg-[#fff1f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {isLoggingOut ? t("loggingOut") : t("logout")}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes dropdown-appear {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cart-bounce {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.1); }
        }
        .dropdown-menu { animation: dropdown-appear 0.18s ease-out; }
        .animate-cart-bounce {
          animation: cart-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          color: #c8102e;
        }
      `}</style>
    </div>
  );
}
