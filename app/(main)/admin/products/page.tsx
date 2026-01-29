import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import ProductManagement from "./ProductManagement";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminProductsPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-10">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Product Management</h1>
                    <p className="text-gray-500 mt-2">Manage your catalogue, stock levels, and pricing.</p>
                </div>
                <Link
                    href="/admin"
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-[#C8102E] transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                    Back to Admin
                </Link>
            </div>

            <ProductManagement />
        </div>
    );
}
