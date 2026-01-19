import { auth } from "../../lib/auth-helper";
import { redirect } from "next/navigation";
import OrdersList from "./OrdersList";

export default async function OrdersPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/orders");
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "50px auto", padding: "20px" }}>
            <h1 style={{ marginBottom: "30px" }}>My Orders</h1>
            <OrdersList />
        </div>
    );
}
