"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCart } from "@@/context/CartContext";
import SearchBar from "./SearchBar";
import "./navbar-client.css";

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
    const { cartCount, isAnimating } = useCart();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [imageError, setImageError] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
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

    // Get user initials for avatar
    const getInitials = (email: string) => {
        return email.charAt(0).toUpperCase();
    };

    // Get display name from email or user name
    const getDisplayName = () => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        if (user.firstName) {
            return user.firstName;
        }
        const name = user.email.split("@")[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    return (
        <div className="navbar-client">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-4">
                <SearchBar />
            </div>

            {/* Cart Icon */}
            <Link href="/cart" className="cart-button">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`cart-icon ${isAnimating ? "animate-cart-bounce" : ""}`}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                </svg>
                {cartCount > 0 && (
                    <span className="cart-badge">{cartCount}</span>
                )}
            </Link>

            {/* User Avatar & Dropdown */}
            <div className="user-menu" ref={dropdownRef}>
                <button
                    className="avatar-button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-label="User menu"
                >
                    <div className="avatar">
                        {user.avatar && !imageError ? (
                            <img
                                src={user.avatar}
                                alt="User avatar"
                                className="avatar-image"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <span className="avatar-text">{getInitials(user.email)}</span>
                        )}
                    </div>
                    <span className="user-name">{getDisplayName()}</span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="dropdown-menu">
                        <div className="dropdown-header">
                            <div className="dropdown-email">{user.email}</div>
                            <div className="dropdown-role">{user.role}</div>
                        </div>

                        <div className="dropdown-divider" />

                        <Link
                            href="/profile"
                            className="dropdown-item"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="dropdown-icon"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                />
                            </svg>
                            Profile
                        </Link>

                        <Link
                            href="/orders"
                            className="dropdown-item"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="dropdown-icon"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                />
                            </svg>
                            Orders
                        </Link>

                        <Link
                            href="/profile/addresses"
                            className="dropdown-item"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="dropdown-icon"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                />
                            </svg>
                            Your Addresses
                        </Link>

                        {/* Admin Only - Add Product */}
                        {user.role === "ADMIN" && (
                            <>
                                <Link
                                    href="/admin/products"
                                    className="dropdown-item"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="dropdown-icon"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 4.5v15m7.5-7.5h-15"
                                        />
                                    </svg>
                                    Add Product
                                </Link>

                                <Link
                                    href="/admin/banners"
                                    className="dropdown-item"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="dropdown-icon"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                        />
                                    </svg>
                                    Banners
                                </Link>
                            </>
                        )}

                        <div className="dropdown-divider" />

                        <button
                            className="dropdown-item logout-item"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="dropdown-icon"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                                />
                            </svg>
                            {isLoggingOut ? "Logging out..." : "Logout"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
