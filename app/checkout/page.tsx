import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import PaymentCheckout from "./PaymentCheckout";

export default async function CheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ orderId?: string }>;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/checkout");
    }

    const params = await searchParams;
    const orderId = params.orderId;

    if (!orderId) {
        // No order ID, redirect to cart
        redirect("/cart");
    }

    return (
        <div style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
            <h1 style={{ marginBottom: "30px" }}>Payment</h1>
            <PaymentCheckout orderId={orderId} />
        </div>
    );
}
