"use client";

import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@@/components/ui/dropdown-menu";
import {
    ChevronDown,
    Layers,
    Smartphone,
    Shirt,
    Home,
    Gamepad2,
    BookOpen,
    Activity,
    Sparkles,
    ShoppingBag,
    Monitor,
    Watch,
    Headphones,
    Search,
    ArrowRight,
    Zap
} from "lucide-react";
import { cn } from "@@/lib/utils";

interface Category {
    id: string;
    name: string;
}

// Helper to get consistent icon for category
const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("phone") || n.includes("mobile")) return Smartphone;
    if (n.includes("laptop") || n.includes("comp")) return Monitor;
    if (n.includes("elec")) return Zap; // Generic electronics
    if (n.includes("cloth") || n.includes("fash") || n.includes("wear")) return Shirt;
    if (n.includes("book")) return BookOpen;
    if (n.includes("home") || n.includes("garden") || n.includes("dec")) return Home;
    if (n.includes("sport") || n.includes("fit")) return Activity;
    if (n.includes("toy") || n.includes("game")) return Gamepad2;
    if (n.includes("beauty") || n.includes("health")) return Sparkles;
    if (n.includes("watch")) return Watch;
    if (n.includes("audio") || n.includes("sound") || n.includes("head")) return Headphones;
    return Layers; // Default
};

// Generic icon component to render the icon dynamically
const CategoryIcon = ({ icon: Icon, className }: { icon: any, className?: string }) => {
    return <Icon className={className} />;
};

export function CategoryDropdown({ categories }: { categories: Category[] }) {
    if (!categories || categories.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="group flex items-center gap-1.5 px-3 py-2 text-[#1A1A1A] hover:text-[#C8102E] hover:bg-red-50 rounded-full transition-all duration-200 focus:outline-none font-semibold text-[15px]">
                <Layers className="w-4 h-4" />
                <span>Categories</span>
                <ChevronDown className="h-4 w-4 text-[#A9A9A9] group-hover:text-[#C8102E] transition-colors" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                className="w-72 p-2 bg-white border-[#A9A9A9] shadow-xl rounded-xl animate-in fade-in slide-in-from-top-2"
                sideOffset={8}
            >
                <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-[#A9A9A9] uppercase tracking-wider">
                    Browse by Category
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-[#A9A9A9]/20 my-1" />

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar py-1">
                    {categories.map((category) => {
                        const Icon = getCategoryIcon(category.name);
                        return (
                            <DropdownMenuItem key={category.id} asChild className="focus:bg-red-50 focus:text-[#C8102E] rounded-lg cursor-pointer my-0.5">
                                <Link
                                    href={`/category/${category.name.toLowerCase()}`}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 group"
                                >
                                    <div className="p-2 rounded-md bg-gray-50 text-[#A9A9A9] group-hover:bg-[#C8102E]/10 group-hover:text-[#C8102E] transition-colors">
                                        <CategoryIcon icon={Icon} className="w-4 h-4" />
                                    </div>
                                    <span className="font-semibold text-[#1A1A1A] group-hover:text-[#C8102E] transition-colors">
                                        {category.name}
                                    </span>
                                    <ChevronDown className="ml-auto w-4 h-4 text-[#A9A9A9] -rotate-90 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </Link>
                            </DropdownMenuItem>
                        );
                    })}
                </div>

                <DropdownMenuSeparator className="bg-[#A9A9A9]/20 my-1" />

                <DropdownMenuItem asChild className="focus:bg-gray-50 rounded-lg cursor-pointer">
                    <Link
                        href="/products"
                        className="w-full flex items-center justify-between px-3 py-3 text-sm font-bold text-[#C8102E] hover:text-[#A90D27]"
                    >
                        <span className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            View All Products
                        </span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


