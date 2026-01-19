import { auth } from "../../lib/auth-helper";
import { redirect } from "next/navigation";
import CheckoutContent from "./CheckoutContent";

export default async function CheckoutPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/checkout");
    }

    return (
        <div style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
            <h1 style={{ marginBottom: "30px" }}>Checkout</h1>
            <CheckoutContent />
        </div>
    );
}
