"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User, LogIn, LayoutDashboard, Package, FolderTree, ChevronDown } from "lucide-react";
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
        firstName?: string | null;
        lastName?: string | null;
    } | null;
}

export default function MobileMenu({ categories, user }: MobileMenuProps) {
    const [open, setOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const pathname = usePathname();

    // Close menu when route changes
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    const isAdmin = user?.role === "ADMIN";

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-[#1A1A1A]">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col bg-white">
                <SheetHeader className="p-4 border-b border-gray-100 bg-gray-50/30">
                    <SheetTitle className="text-left font-bold text-lg text-[#1A1A1A]">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="flex flex-col gap-2 px-4">
                        {/* Public Navigation */}
                        <div className="space-y-1">
                            <Link
                                href="/"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${pathname === "/" ? "bg-[#C8102E]/10 text-[#C8102E]" : "text-[#1A1A1A] hover:bg-gray-100"
                                    }`}
                            >
                                Home
                            </Link>
                            <Link
                                href="/products"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${pathname === "/products" ? "bg-[#C8102E]/10 text-[#C8102E]" : "text-[#1A1A1A] hover:bg-gray-100"
                                    }`}
                            >
                                Products
                            </Link>
                        </div>

                        {/* Categories Accordion */}
                        <div className="space-y-1">
                            <button
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-[#1A1A1A] hover:bg-gray-100 rounded-md transition-colors group"
                            >
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-[#1A1A1A] transition-colors">Categories</span>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCategoriesOpen ? "rotate-180 text-[#C8102E]" : ""
                                        }`}
                                />
                            </button>

                            <div className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isCategoriesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                }`}>
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/products?category=${encodeURIComponent(category.name)}`}
                                        onClick={() => setOpen(false)}
                                        className="block px-3 py-2 pl-6 rounded-md text-sm text-gray-600 hover:text-[#C8102E] hover:bg-gray-50 transition-colors"
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Admin Navigation */}
                        {isAdmin && (
                            <>
                                <div className="my-2 border-t border-gray-100" />
                                <div className="space-y-1">
                                    <p className="px-3 text-xs font-semibold text-[#C8102E] uppercase tracking-wider mb-2">
                                        Admin Panel
                                    </p>
                                    <Link
                                        href="/admin"
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/admin" ? "bg-gray-100 text-[#1A1A1A]" : "text-gray-600 hover:bg-gray-50 hover:text-[#1A1A1A]"
                                            }`}
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Admin
                                    </Link>
                                    <Link
                                        href="/admin/products"
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/products") ? "bg-gray-100 text-[#1A1A1A]" : "text-gray-600 hover:bg-gray-50 hover:text-[#1A1A1A]"
                                            }`}
                                    >
                                        <Package className="w-4 h-4" />
                                        Products
                                    </Link>
                                </div>
                            </>
                        )}
                    </nav>
                </div>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    {user ? (
                        <Link href="/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200">
                            <div className="w-10 h-10 rounded-full bg-[#C8102E]/10 flex items-center justify-center text-[#C8102E] overflow-hidden">
                                {user.image ? (
                                    <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-sm">{(user.name || user.email || "U").charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-[#1A1A1A] truncate">{user.name || "User"}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="grid gap-2">
                            <Button asChild className="w-full bg-[#C8102E] hover:bg-[#A90D27] text-white">
                                <Link href="/login">
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Sign In
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/register">Create Account</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
