import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import CartContent from "./CartContent";

export default async function CartPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/cart");
    }

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-6 my-8 md:my-12">
            <h1 className="text-3xl font-black text-[#1A1A1A] mb-6 md:mb-8">Shopping Cart</h1>
            <CartContent />
        </div>
    );
}
