import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import DeleteBannerButton from "./DeleteBannerButton";

export default async function BannersPage() {
    const session = await auth();

    // Check if user is logged in
    if (!session) {
        redirect("/login");
    }

    // Check if user has ADMIN role
    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    // Fetch all banners ordered by order field
    const banners = await prisma.banner.findMany({
        orderBy: { order: "asc" },
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#A9A9A9]/20 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">
                        Banner Management
                    </h1>
                    <p className="text-[#A9A9A9] font-medium mt-2">
                        Manage homepage carousel banners and settings.
                    </p>
                </div>
                <div className="bg-[#FAFAFA] border border-[#A9A9A9] px-6 py-3 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-[#A9A9A9] uppercase tracking-widest">
                        Total:
                    </span>
                    <span className="text-sm font-bold text-[#1A1A1A]">
                        {banners.length} {banners.length === 1 ? "Banner" : "Banners"}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
                <Link
                    href="/admin/banners/settings"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#A9A9A9] text-[#1A1A1A] font-bold rounded-xl hover:bg-[#FAFAFA] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    Carousel Settings
                </Link>
            </div>

            {/* Banners Grid */}
            {banners.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-[#A9A9A9] rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-[#FAFAFA] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-8 h-8 text-[#A9A9A9]"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">
                        No Banners Yet
                    </h3>
                    <p className="text-[#A9A9A9] mb-6">
                        Create your first banner to display on the homepage carousel.
                    </p>
                    <Link
                        href="/admin/banners/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A00D24] transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Add First Banner
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.map((banner) => (
                        <div
                            key={banner.id}
                            className="bg-white border-2 border-[#E5E5E5] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-[#C8102E]/30 group"
                        >
                            {/* Banner Image */}
                            <div className="relative aspect-video bg-[#FAFAFA] overflow-hidden">
                                <Image
                                    src={banner.imageUrl}
                                    alt={banner.title || "Banner"}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {/* Order Badge */}
                                <div className="absolute top-3 left-3 bg-[#1A1A1A]/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold">
                                    Order: {banner.order}
                                </div>
                                {/* Status Badge */}
                                <div className="absolute top-3 right-3">
                                    {banner.active ? (
                                        <div className="bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                            Active
                                        </div>
                                    ) : (
                                        <div className="bg-[#A9A9A9]/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold">
                                            Inactive
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Banner Info */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-[#1A1A1A] mb-1 line-clamp-1">
                                    {banner.title || "Untitled Banner"}
                                </h3>
                                <p className="text-sm text-[#A9A9A9] mb-4 line-clamp-2">
                                    {banner.subtitle || "No subtitle"}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Link
                                        href={`/admin/banners/${banner.id}/edit`}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A00D24] transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className="w-4 h-4"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                            />
                                        </svg>
                                        Edit
                                    </Link>
                                    <DeleteBannerButton bannerId={banner.id} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Floating Add Button */}
            <Link
                href="/admin/banners/new"
                className="fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 bg-[#C8102E] text-white font-bold rounded-full hover:bg-[#A00D24] transition-all duration-200 shadow-2xl hover:shadow-[#C8102E]/50 hover:scale-105 group z-50"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                    />
                </svg>
                <span className="font-black tracking-wide">Add Banner</span>
            </Link>
        </div>
    );
}
