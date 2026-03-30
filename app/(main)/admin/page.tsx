import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserManagementTable from "./UserManagementTable";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function AdminPage() {
    const t = await getTranslations("admin");
    const session = await auth();

    // Check if user is logged in
    if (!session) {
        redirect("/login");
    }

    // Check if user has ADMIN role
    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    const paidOrderCount = await prisma.order.count({
        where: {
            status: "PAID"
        }
    });

    const lowStockProducts = await prisma.product.findMany({
        where: {
            stock: { gt: 0, lte: 5 },
            isActive: true,
        },
        select: {
            id: true,
            title: true,
            stock: true,
            thumbnail: true,
        },
        orderBy: { stock: "asc" },
        take: 10,
    });

    const outOfStockCount = await prisma.product.count({
        where: { stock: 0, isActive: false },
    });

    const pendingReturnsCount = await prisma.returnRequest.count({
        where: { status: "PENDING" },
    });

    const unreadMessagesCount = await prisma.contactMessage.count({
        where: { isRead: false },
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t("dashboard")}</h1>
                    <p className="text-gray-500 mt-2">{t("dashboardSubtitle")}</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">{session.user.email}</span>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <Link href="/admin/products" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 15.75h3.75M12 7.5V3.75m0 3.75H8.25m3.75 0H3.75m3.75 0V1.5m0 2.25h-2.25" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Manage</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t("products")}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("productsDescription")}</p>
                </Link>

                <Link href="/admin/orders" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all relative">
                    {paidOrderCount > 0 && (
                        <span className="absolute top-4 right-4 bg-purple-600 group-hover:bg-[#C8102E] text-white text-[0.7rem] font-bold px-1.5 py-1.5 rounded-full min-w-[16px] h-[21px] flex items-center justify-center shadow-sm border border-white leading-none animate-in fade-in zoom-in duration-300 z-10">
                            {paidOrderCount}
                        </span>
                    )}
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">View</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t("orders")}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("ordersDescription")}</p>
                </Link>

                <Link href="/admin/banners" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Edit</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t("banners")}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("bannersDescription")}</p>
                </Link>

                <Link href="/admin/payment-management" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Configure</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t("paymentSettings")}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("paymentSettingsDescription")}</p>
                </Link>

                <Link href="/admin/coupons" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-pink-50 text-pink-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Manage</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t("coupons")}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("couponsDescription")}</p>
                </Link>

                <Link href="/admin/categories" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Manage</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t("categories")}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("categoriesDescription")}</p>
                </Link>

                <Link href="/admin/sale-analysis" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M6 16.5h2.25m-2.25 0V9m2.25 7.5V9m2.25-6v13.5c0 .414.336.75.75.75h3.75a.75.75 0 00.75-.75V3" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Analyze</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t("saleAnalysis")}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("saleAnalysisDescription")}</p>
                </Link>

                <Link href="/admin/returns" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all relative">
                    {pendingReturnsCount > 0 && (
                        <span className="absolute top-4 right-4 bg-orange-500 group-hover:bg-[#C8102E] text-white text-[0.7rem] font-bold px-1.5 py-1.5 rounded-full min-w-[16px] h-[21px] flex items-center justify-center shadow-sm border border-white leading-none animate-in fade-in zoom-in duration-300 z-10">
                            {pendingReturnsCount}
                        </span>
                    )}
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Review</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t("returns")}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("returnsDescription")}</p>
                </Link>

                <Link href="/admin/messages" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all relative">
                    {unreadMessagesCount > 0 && (
                        <span className="absolute top-4 right-4 bg-sky-500 group-hover:bg-[#C8102E] text-white text-[0.7rem] font-bold px-1.5 py-1.5 rounded-full min-w-[16px] h-[21px] flex items-center justify-center shadow-sm border border-white leading-none animate-in fade-in zoom-in duration-300 z-10">
                            {unreadMessagesCount}
                        </span>
                    )}
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">View</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t("messages")}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t("messagesDescription")}</p>
                </Link>
            </div>

            {/* Low Stock Warning */}
            {(lowStockProducts.length > 0 || outOfStockCount > 0) && (
                <div className="mb-12 bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-amber-900">{t("lowStockAlert")}</h2>
                                <p className="text-xs text-amber-600">
                                    {t("productsRunningLow", { count: lowStockProducts.length })}
                                    {outOfStockCount > 0 && <span className="text-red-600 font-bold"> &middot; {t("outOfStockCount", { count: outOfStockCount })}</span>}
                                </p>
                            </div>
                        </div>
                        <Link href="/admin/products" className="text-xs font-semibold text-amber-700 hover:text-[#C8102E] transition-colors">
                            {t("viewAllProducts")} &rarr;
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {lowStockProducts.map((product) => (
                            <a key={product.id} href={`/admin/products/${product.id}/edit`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                    {product.thumbnail ? (
                                        <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    product.stock <= 2
                                        ? "bg-red-50 text-red-600 border border-red-100"
                                        : "bg-amber-50 text-amber-600 border border-amber-100"
                                }`}>
                                    <span>{t("itemsLeft", { count: product.stock })}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Section Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t("systemUsers")}</h2>
                <p className="text-sm text-gray-500">{t("manageAccess")}</p>
            </div>

            <UserManagementTable />
        </div>
    );
}
