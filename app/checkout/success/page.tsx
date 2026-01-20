import { auth } from "../../../lib/auth-helper";
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
        <div style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
            <SuccessContent orderId={orderId} />
        </div>
    );
}
