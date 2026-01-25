import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#A9A9A9]/20 pb-8">
        <div>
          <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">Your Dashboard</h1>
          <p className="text-[#A9A9A9] font-medium mt-2">Manage your account and view your profile information.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-[#A9A9A9] shadow-sm overflow-hidden">
          <div className="bg-[#1A1A1A] px-8 py-4">
            <h2 className="text-lg font-bold text-white">Profile Details</h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-black text-[#A9A9A9] uppercase tracking-wider">Email Address</label>
              <p className="text-lg font-bold text-[#1A1A1A]">{session.user.email}</p>
            </div>

            <div className="flex gap-12">
              <div className="space-y-1">
                <label className="text-xs font-black text-[#A9A9A9] uppercase tracking-wider">Account Role</label>
                <p className="text-lg font-bold text-[#C8102E] capitalize">{(session.user.role || "user").toLowerCase()}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-[#A9A9A9] uppercase tracking-wider">User ID</label>
                <p className="text-sm font-mono font-medium text-[#1A1A1A] opacity-60">#{session.user.id.slice(0, 8)}...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions or Stats could go here */}
        <div className="flex flex-col gap-4">
          <div className="bg-red-50 border border-[#C8102E]/10 p-8 rounded-2xl flex-1 flex flex-col justify-center">
            <h3 className="text-xl font-black text-[#C8102E] mb-2">Welcome Back!</h3>
            <p className="text-[#1A1A1A] font-medium leading-relaxed">
              Thank you for being a valued customer. Check out our latest arrivals or view your order history.
            </p>
          </div>
          <a
            href="/orders"
            className="flex items-center justify-between p-6 bg-white border border-[#A9A9A9] rounded-2xl hover:border-[#C8102E] hover:shadow-md transition-all group"
          >
            <span className="font-bold text-[#1A1A1A]">View My Orders</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-[#C8102E] group-hover:translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
