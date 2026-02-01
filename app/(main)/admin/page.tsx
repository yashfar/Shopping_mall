import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import UserManagementTable from "./UserManagementTable";

export default async function AdminPage() {
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-2">Overview of your store's performance and settings.</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">{session.user.email}</span>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <a href="/admin/products" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 15.75h3.75M12 7.5V3.75m0 3.75H8.25m3.75 0H3.75m3.75 0V1.5m0 2.25h-2.25" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Manage</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Products</h3>
                    <p className="text-sm text-gray-500 mt-1">Add, edit, or remove products from your catalog.</p>
                </a>

                <a href="/admin/orders" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">View</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Orders</h3>
                    <p className="text-sm text-gray-500 mt-1">Track and manage customer orders.</p>
                </a>

                <a href="/admin/banners" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Edit</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Banners</h3>
                    <p className="text-sm text-gray-500 mt-1">Update promotional banners and sliders.</p>
                </a>

                <a href="/admin/payment-management" className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-[#C8102E]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-[#C8102E] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-[#C8102E]">Configure</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Payment Settings</h3>
                    <p className="text-sm text-gray-500 mt-1">Configure taxes, shipping fees, and thresholds.</p>
                </a>
            </div>

            {/* Section Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">System Users</h2>
                <p className="text-sm text-gray-500">Manage access and permissions.</p>
            </div>

            <UserManagementTable />
        </div>
    );
}
