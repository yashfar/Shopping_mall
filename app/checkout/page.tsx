import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import PaymentCheckoutWithAddress from "./PaymentCheckoutWithAddress";

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
        <div style={{ maxWidth: "1000px", margin: "50px auto", padding: "20px" }}>
            <h1 style={{ marginBottom: "30px", textAlign: "center", fontSize: "2rem", fontWeight: "700" }}>
                Checkout
            </h1>
            <PaymentCheckoutWithAddress orderId={orderId} />
        </div>
    );
}
