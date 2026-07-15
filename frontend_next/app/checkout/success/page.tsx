import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import SuccessContent from "./SuccessContent";

export default async function CheckoutSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ orderId?: string }>;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const params = await searchParams;
    const orderId = params.orderId;

    if (!orderId) {
        redirect("/orders");
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
            <SuccessContent orderId={orderId} />
        </div>
    );
}
