import { auth } from "@@/lib/auth-helper";
import Link from "next/link";
import NavbarClient from "@@/components/NavbarClient";
import { CategoryDropdown } from "@@/components/CategoryDropdown";
import { prisma } from "@/lib/prisma";
import "./navbar.css";
import Image from "next/image";
import FilishopLogoLight from "@@/public/logo/Filishop-logo-light.png";
import FilishopLogoDark from "@@/public/logo/Filishop-logo-dark.png";
export default async function Navbar() {
    const session = await auth();
    // Use try-catch or ensure prisma works. If prisma is in app/lib, then @/lib/prisma is correct. 
    // But I will stick to what worked or check. 
    // Actually, I'll use imports that are safe. 
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
    });

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo/Brand */}
                <Link href="/" className="navbar-brand">
                    <Image
                        src={FilishopLogoLight}
                        alt="My Store Logo"
                        width={150}
                        height={150}
                    />
                    {/* <span className="brand-text">My Store</span> */}
                </Link>

                {/* Navigation Links */}
                <div className="navbar-links">
                    <Link href="/products" className="nav-link">
                        Products
                    </Link>
                    <CategoryDropdown categories={categories} />
                    {session?.user?.role === "ADMIN" && (
                        <Link href="/admin" className="nav-link">
                            Admin
                        </Link>
                    )}
                </div>

                {/* Right Side - Auth & Cart */}
                <div className="navbar-actions">
                    {!session ? (
                        // Not authenticated - show Login/Register
                        <div className="auth-buttons">
                            <Link href="/login" className="btn-login">
                                Login
                            </Link>
                            <Link href="/register" className="btn-register">
                                Register
                            </Link>
                        </div>
                    ) : (
                        // Authenticated - show user info and cart
                        <NavbarClient
                            user={{
                                email: session.user.email || "",
                                role: session.user.role || "USER",
                                avatar: session.user.avatar || null,
                                firstName: session.user.firstName || null,
                                lastName: session.user.lastName || null,
                            }}
                        />
                    )}
                </div>
            </div>
        </nav>
    );
}
