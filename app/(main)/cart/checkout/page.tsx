import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import Link from "next/link";
import CheckoutContent from "../CheckoutContent";

export default async function CheckoutReviewPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/cart");
    }

    return (
        <div className="bg-[#FAFAFA] min-h-screen pb-12">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
                <div className="mb-8">
                    <Link
                        href="/cart"
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#C8102E] transition-colors group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Back to Cart
                    </Link>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] mb-2">Review Order</h1>
                <p className="text-gray-500 font-medium mb-8">Please verify your items and shipping details before proceeding.</p>

                <CheckoutContent />
            </div>
        </div>
    );
}
