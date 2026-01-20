import { auth } from "../../../lib/auth-helper";
import { redirect } from "next/navigation";
import Link from "next/link";
import CheckoutContent from "../CheckoutContent";

export default async function CheckoutReviewPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/cart");
    }

    return (
        <div style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
            <div style={{ marginBottom: "20px" }}>
                <Link
                    href="/cart"
                    style={{
                        color: "#0070f3",
                        textDecoration: "none",
                        fontSize: "14px",
                    }}
                >
                    ← Back to Cart
                </Link>
            </div>
            <h1 style={{ marginBottom: "30px" }}>Review Order</h1>
            <CheckoutContent />
        </div>
    );
}
