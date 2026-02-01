import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import OrdersList from "./OrdersList";

export default async function OrdersPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/orders");
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">My Orders</h1>
                    <p className="text-gray-500 mt-2 font-medium">Track and manage your recent purchases.</p>
                </div>
            </div>
            <OrdersList />
        </div>
    );
}
