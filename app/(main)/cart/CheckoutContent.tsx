"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
    id: string;
    quantity: number;
    product: {
        id: string;
        title: string;
        price: number;
    };
};

type Cart = {
    id: string;
    items: CartItem[];
};

export default function CheckoutContent() {
    const router = useRouter();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [hasAddresses, setHasAddresses] = useState(true);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await fetch("/api/cart");
                if (!response.ok) throw new Error("Failed to fetch cart");
                const data = await response.json();
                setCart(data.cart);

                // Redirect to cart if empty (only on initial load)
                if (!data.cart || data.cart.items.length === 0) {
                    router.push("/cart");
                }
            } catch (error) {
                console.error("Error fetching cart:", error);
            } finally {
                setLoading(false);
            }
        };

        const checkAddresses = async () => {
            try {
                const response = await fetch("/api/address/list");
                if (response.ok) {
                    const data = await response.json();
                    const addressesExist = data.addresses && data.addresses.length > 0;
                    setHasAddresses(addressesExist);

                    // Redirect to cart if no addresses
                    if (!addressesExist) {
                        router.push("/cart");
                    }
                }
            } catch (error) {
                console.error("Error checking addresses:", error);
            }
        };

        fetchCart();
        checkAddresses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const createOrder = async () => {
        try {
            setCreating(true);
            const response = await fetch("/api/orders/create", {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create order");
            }

            const data = await response.json();

            // Redirect to payment page
            router.push(`/checkout?orderId=${data.orderId}`);
        } catch (error: any) {
            console.error("Error creating order:", error);
            alert(error.message || "Failed to create order");
            setCreating(false); // Only reset on error
        }
        // Don't reset creating on success - let the redirect happen
    };


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                <p className="text-[#A9A9A9] font-semibold">Preparing your order...</p>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return null; // Will redirect
    }

    const total = cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-[#A9A9A9] shadow-sm overflow-hidden p-8">
                <h2 className="text-2xl font-black text-[#1A1A1A] mb-8 border-b border-[#A9A9A9]/20 pb-4">Order Summary</h2>

                <div className="space-y-6 mb-8">
                    {cart.items.map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between items-start"
                        >
                            <div className="space-y-1">
                                <div className="font-bold text-[#1A1A1A] text-lg">{item.product.title}</div>
                                <div className="text-sm font-bold text-[#A9A9A9] bg-[#FAFAFA] px-2 py-1 rounded inline-block">
                                    Quantity: {item.quantity}
                                </div>
                            </div>
                            <div className="font-black text-[#1A1A1A] text-lg">
                                ${(item.product.price / 100).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-6 border-t-2 border-[#1A1A1A]">
                    <span className="text-xl font-extrabold text-[#1A1A1A]">Grand Total</span>
                    <span className="text-3xl font-black text-[#C8102E]">
                        ${(total / 100).toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="bg-red-50 border border-[#C8102E]/20 p-6 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-[#C8102E] rounded-xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
                <div className="space-y-1">
                    <p className="text-[#1A1A1A] font-bold">Ready to place order</p>
                    <p className="text-sm text-[#4A4A4A] font-medium leading-relaxed">
                        Click "Confirm & Place Order" to complete your purchase. You'll be redirected to the secure payment page next.
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => router.push("/cart")}
                    disabled={creating}
                    className="flex-1 py-4 px-6 border border-[#A9A9A9] rounded-xl text-[#1A1A1A] font-bold transition-all hover:bg-[#FAFAFA] hover:border-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Back to Cart
                </button>
                <button
                    onClick={createOrder}
                    disabled={creating}
                    className={`flex-1 py-4 px-6 rounded-xl text-white font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${creating ? "bg-[#A9A9A9] cursor-not-allowed" : "bg-[#C8102E] hover:bg-[#A90D27] hover:shadow-[0_8px_20px_rgba(200,16,46,0.3)] active:scale-95"}`}
                >
                    {creating ? (
                        <>
                            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            Confirm & Place Order
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
