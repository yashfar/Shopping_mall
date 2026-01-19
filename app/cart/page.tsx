import { auth } from "../../lib/auth-helper";
import { redirect } from "next/navigation";
import CartContent from "./CartContent";

export default async function CartPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/cart");
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "50px auto", padding: "20px" }}>
            <h1 style={{ marginBottom: "30px" }}>Shopping Cart</h1>
            <CartContent />
        </div>
    );
}
