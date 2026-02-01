"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateCartTotals } from "@@/lib/payment-utils";
import Image from "next/image";
import Link from "next/link";

type CartItem = {
    id: string;
    quantity: number;
    product: {
        id: string;
        title: string;
        price: number;
        thumbnail: string | null;
    };
};

type Cart = {
    id: string;
    items: CartItem[];
};

export default function CheckoutContent() {
    const router = useRouter();
    const [cart, setCart] = useState<Cart | null>(null);
    const [config, setConfig] = useState<{ taxPercent: number; shippingFee: number; freeShippingThreshold: number } | null>(null);
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
                setConfig(data.config);

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

    const totals = cart && config ? calculateCartTotals(cart.items, config) : null;

    if (!totals || !config) return null; // Should wait for loading but cart checked above

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            {/* Left Column: Order Details */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 md:p-8">
                    <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-6 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#C8102E]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        Items in your order
                    </h2>

                    <div className="space-y-6">
                        {cart.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-4 py-4 border-b border-gray-100 last:border-0 last:pb-0"
                            >
                                {/* Thumbnail */}
                                <Link
                                    href={`/product/${item.product.id}`}
                                    className="relative w-16 h-20 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden"
                                >
                                    {item.product.thumbnail ? (
                                        <Image
                                            src={item.product.thumbnail}
                                            alt={item.product.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl">📦</span>
                                    )}
                                </Link>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <Link
                                                href={`/product/${item.product.id}`}
                                                className="font-bold text-[#1A1A1A] leading-snug hover:text-[#C8102E] transition-colors"
                                            >
                                                {item.product.title}
                                            </Link>
                                            <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="font-extrabold text-[#1A1A1A]">
                                            ${(item.product.price / 100).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-[#1A1A1A] font-medium text-right">
                                        Subtotal: <span className="text-[#C8102E]">${((item.product.price * item.quantity) / 100).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[#1A1A1A] font-bold">Shipping Information</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {totals.shippingAmount === 0
                                ? "You qualify for free shipping! Your items will be shipped immediately."
                                : `Standard shipping fee of $${(config.shippingFee / 100).toFixed(2)} applies.`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column: Place Order */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 sticky top-24">
                    <h2 className="text-xl font-extrabold text-[#1A1A1A]">Order Summary</h2>

                    <div className="space-y-3 pb-6 border-b border-gray-100">
                        <div className="flex justify-between items-center text-gray-500 font-medium">
                            <span className="text-md flex flex-col">Subtotal <span className="text-xs">(Tax included)</span></span>
                            <span className="text-[#1A1A1A] font-bold">${(totals.subtotal / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-500 font-medium">
                            <span className="text-md">Shipping</span>
                            {totals.shippingAmount === 0 ? (
                                <span className="text-emerald-600 font-bold">FREE</span>
                            ) : (
                                <span className="text-[#1A1A1A] font-bold">${(totals.shippingAmount / 100).toFixed(2)}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-gray-400 text-sm">
                            <span>Estimated Tax (Included)</span>
                            <span className="font-medium">${(totals.taxAmount / 100).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-[#1A1A1A]">Total</span>
                        <span className="text-2xl font-black text-[#C8102E]">
                            ${(totals.total / 100).toFixed(2)}
                        </span>
                    </div>

                    <div className="space-y-3 pt-4">
                        <button
                            onClick={createOrder}
                            disabled={creating}
                            className={`w-full py-4 px-4 rounded-full text-white font-black text-lg transition-all shadow-[0_4px_14px_0_rgba(200,16,46,0.39)] hover:shadow-[0_6px_20px_rgba(200,16,46,0.23)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group ${creating ? "bg-gray-400" : "bg-gradient-to-r from-[#C8102E] to-[#b91c1c]"}`}
                        >
                            {/* Shine effect */}
                            {!creating && (
                                <div className="absolute top-0 -left-[120%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:left-[120%] transition-all duration-1000 ease-in-out" />
                            )}

                            <span className="relative z-10 flex items-center justify-center gap-2 text-lg md:text-sm">
                                {creating ? "Processing..." : "Confirm Payment"}
                                {!creating && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.28 10.28a.75.75 0 0 0 0-1.06l-3-3a.75.75 0 1 0-1.06 1.06l1.72 1.72H8.25a.75.75 0 0 0 0 1.5h5.69l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3Z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </span>
                        </button>

                        <button
                            onClick={() => router.push("/cart")}
                            disabled={creating}
                            className="w-full py-3 px-6 text-sm font-bold text-gray-500 hover:text-[#C8102E] transition-colors"
                        >
                            Back to Cart
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium pt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        Secure Checkout
                    </div>
                </div>
            </div>
        </div>
    );
}
