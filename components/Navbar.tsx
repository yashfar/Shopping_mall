import { auth } from "@@/lib/auth-helper";
import Link from "next/link";
import NavbarClient from "@@/components/NavbarClient";
import { CategoryDropdown } from "@@/components/CategoryDropdown";
import MobileMenu from "@@/components/MobileMenu";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import FilishopLogoLight from "@@/public/logo/Filishop-logo-light.png";
import AdminNavbarLink from "@@/components/AdminNavbarLink";

export default async function Navbar() {
    const session = await auth();
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
    });

    return (
        <nav className="sticky top-0 z-40 p-1 transition-all duration-300">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-6 bg-white/90 backdrop-blur-md rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-[#A9A9A9]/10">
                {/* Logo/Brand */}
                <Link href="/" className="no-underline text-[#1A1A1A] font-bold text-xl md:text-2xl flex items-center gap-3 transition-all duration-200 hover:opacity-80">
                    <Image
                        src={FilishopLogoLight}
                        alt="My Store Logo"
                        width={120}
                        height={40}
                        className="object-contain"
                    />
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex gap-8 flex-1 ml-8 items-center">
                    <Link href="/products" className="no-underline text-[#1A1A1A] font-semibold text-[0.95rem] transition-all duration-200 hover:text-[#C8102E] relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#C8102E] after:transition-all after:duration-300 hover:after:w-full">
                        Products
                    </Link>
                    <CategoryDropdown categories={categories} />
                    {session?.user?.role === "ADMIN" && (
                        <AdminNavbarLink />
                    )}
                </div>

                {/* Right Side - Auth & Cart */}
                <div className="flex items-center gap-4 md:gap-6">
                    {!session ? (
                        // Not authenticated - show Login/Register (Desktop only)
                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/login" className="no-underline text-[#1A1A1A] font-semibold text-[0.95rem] transition-all duration-200 hover:text-[#C8102E]">
                                Login
                            </Link>
                            <Link href="/register" className="no-underline bg-[#C8102E] text-white px-6 py-2.5 rounded-lg font-bold text-[0.95rem] transition-all duration-300 hover:bg-[#A90D27] hover:shadow-[0_4px_12px_rgba(200,16,46,0.3)] hover:-translate-y-0.5">
                                Register
                            </Link>
                        </div>
                    ) : (
                        // Authenticated - show user info and cart
                        <div className="flex items-center gap-6">
                            <NavbarClient
                                user={{
                                    email: session.user.email || "",
                                    role: session.user.role || "USER",
                                    avatar: session.user.avatar || null,
                                    firstName: session.user.firstName || null,
                                    lastName: session.user.lastName || null,
                                }}
                            />
                        </div>
                    )}

                    {/* Mobile Menu */}
                    <MobileMenu
                        categories={categories}
                        user={session?.user ? {
                            name: session.user.firstName ? `${session.user.firstName} ${session.user.lastName || ''}` : session.user.email,
                            email: session.user.email,
                            image: session.user.avatar,
                            role: session.user.role
                        } : null}
                    />
                </div>
            </div>
        </nav>
    );
}
