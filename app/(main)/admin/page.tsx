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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#A9A9A9]/20 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Admin Control Panel</h1>
                    <p className="text-[#A9A9A9] font-medium mt-2">Manage users, adjust permissions, and oversee system activity.</p>
                </div>
                <div className="bg-[#FAFAFA] border border-[#A9A9A9] px-6 py-3 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-[#A9A9A9] uppercase tracking-widest">Logged:</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">{session.user.email}</span>
                </div>
            </div>

            <div className="bg-red-50 border border-[#C8102E]/10 p-6 rounded-2xl mb-12 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 bg-[#C8102E] rounded-xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                </div>
                <div className="space-y-1">
                    <p className="text-[#1A1A1A] font-bold">Administrative Dashboard</p>
                    <p className="text-sm text-[#4A4A4A] font-medium leading-relaxed">
                        Authorized access only. You have full control over user accounts and system configuration. Changes made here are final and immediate.
                    </p>
                </div>
            </div>

            <UserManagementTable />
        </div>
    );
}
