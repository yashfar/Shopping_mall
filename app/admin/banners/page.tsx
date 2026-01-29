import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BannersManagementCard from "@@/components/admin/BannersManagementCard";
import CarouselManagementCard from "@@/components/admin/CarouselManagementCard";

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

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#A9A9A9]/20 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">
                        Featured Content
                    </h1>
                    <p className="text-[#A9A9A9] font-medium mt-2">
                        Manage homepage banners and carousel collections.
                    </p>
                </div>

                <div className="flex gap-3">
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
                                d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 018.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.811 1.035.811 1.73 0 .695-.316 1.3-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
                            />
                        </svg>
                        Settings
                    </Link>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Main Banners - Full Width on Mobile, Half on Desktop */}
                <div className="lg:col-span-2">
                    <BannersManagementCard />
                </div>

                {/* Best Sellers */}
                <div className="min-h-[600px]">
                    <CarouselManagementCard
                        title="Best Sellers"
                        description="Curate the best-selling products carousel."
                        type="best-seller"
                    />
                </div>

                {/* New Products */}
                <div className="min-h-[600px]">
                    <CarouselManagementCard
                        title="New Products"
                        description="Highlight new arrivals and featured items."
                        type="new-products"
                    />
                </div>
            </div>
        </div>
    );
}
