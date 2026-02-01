import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminOrderDetails from "./AdminOrderDetails";

export default async function AdminOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    const { id } = await params;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <Link
                    href="/admin/orders"
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#C8102E] transition-colors mb-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Orders
                </Link>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Details</h1>
                {/* We don't have the order number here yet, so just generic title or use generic description */}
                <p className="text-gray-500 mt-1 font-medium">Manage order details and status.</p>
            </div>
            <AdminOrderDetails orderId={id} />
        </div>
    );
}
