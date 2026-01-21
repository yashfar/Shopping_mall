import { auth } from "@@/lib/auth-helper";
import Link from "next/link";
import NavbarClient from "@@/components/NavbarClient";
import "./navbar.css";

export default async function Navbar() {
    const session = await auth();

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo/Brand */}
                <Link href="/" className="navbar-brand">
                    <span className="brand-text">My Store</span>
                </Link>

                {/* Navigation Links */}
                <div className="navbar-links">
                    <Link href="/products" className="nav-link">
                        Products
                    </Link>
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
