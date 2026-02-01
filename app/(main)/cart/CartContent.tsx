"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@@/context/CartContext";
import { toast } from "sonner";
import { ConfirmDialog } from "@@/components/ConfirmDialog";
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
        stock: number;
        thumbnail: string | null;
    };
};

type Cart = {
    id: string;
    items: CartItem[];
};

export default function CartContent() {
    const router = useRouter();
    const { refreshCart } = useCart();
    const [cart, setCart] = useState<Cart | null>(null);
    const [config, setConfig] = useState<{ taxPercent: number; shippingFee: number; freeShippingThreshold: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [hasAddresses, setHasAddresses] = useState(true);
    const [checkingAddresses, setCheckingAddresses] = useState(true);

    // Confirmation state
    const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; productId: string }>({
        open: false,
        productId: "",
    });

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/cart");
            if (!response.ok) throw new Error("Failed to fetch cart");
            const data = await response.json();
            setCart(data.cart);
            setConfig(data.config);
        } catch (error) {
            console.error("Error fetching cart:", error);
            // toast.error("Failed to load cart"); // Optional on load
        } finally {
            setLoading(false);
        }
    };

    const checkAddresses = async () => {
        try {
            setCheckingAddresses(true);
            const response = await fetch("/api/address/list");
            if (response.ok) {
                const data = await response.json();
                setHasAddresses(data.addresses && data.addresses.length > 0);
            }
        } catch (error) {
            console.error("Error checking addresses:", error);
        } finally {
            setCheckingAddresses(false);
        }
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        try {
            setUpdating(productId);
            const response = await fetch("/api/cart/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantity }),
            });

            if (!response.ok) throw new Error("Failed to update cart");
            const data = await response.json();
            setCart(data.cart);
            await refreshCart(); // Sync navbar
            toast.success("Cart updated");
        } catch (error) {
            console.error("Error updating cart:", error);
            toast.error("Failed to update cart");
        } finally {
            setUpdating(null);
        }
    };

    const handleRemoveItem = async () => {
        const productId = confirmRemove.productId;
        if (!productId) return;

        try {
            setUpdating(productId);
            const response = await fetch("/api/cart/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId }),
            });

            if (!response.ok) throw new Error("Failed to remove item");
            const data = await response.json();
            setCart(data.cart);
            await refreshCart();
            toast.success("Item removed from cart");
        } catch (error) {
            console.error("Error removing item:", error);
            toast.error("Failed to remove item");
        } finally {
            setUpdating(null);
            setConfirmRemove({ open: false, productId: "" });
        }
    };

    const openRemoveConfirm = (productId: string) => {
        setConfirmRemove({ open: true, productId });
    };

    useEffect(() => {
        fetchCart();
        checkAddresses();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                <p className="text-[#A9A9A9] font-semibold">Loading your cart...</p>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4">
                <div className="relative mb-8 group">
                    {/* Background Blob */}
                    <div className="absolute inset-0 bg-red-100 rounded-full blur-2xl opacity-50 scale-150 group-hover:scale-175 transition-transform duration-700" />

                    {/* Floating Icon */}
                    <div className="relative w-24 h-24 bg-gradient-to-tr from-white to-red-50 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-[#C8102E]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>

                        {/* Floating Zero Badge */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#C8102E] text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg border-4 border-white">
                            0
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-black text-[#1A1A1A] mb-4 tracking-tight text-center">Your cart feels a bit light</h2>
                <p className="text-gray-500 mb-10 max-w-md text-center text-lg leading-relaxed">
                    There's nothing in your bag yet. Explore our collection and find something that speaks to you.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <a
                        href="/products"
                        className="group relative px-8 py-4 bg-[#1A1A1A] text-white rounded-full font-bold text-lg overflow-hidden transition-all hover:shadow-xl hover:shadow-gray-200 hover:-translate-y-1 active:scale-95"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
                        <span className="relative flex items-center gap-2">
                            Start Shopping
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </a>
                </div>
            </div>
        );
    }

    const totals = cart && config ? calculateCartTotals(cart.items, config) : null;

    return (
        <div className="space-y-8">
            <ConfirmDialog
                open={confirmRemove.open}
                onOpenChange={(open) => setConfirmRemove(prev => ({ ...prev, open }))}
                title="Remove Item"
                description="Are you sure you want to remove this item from your cart?"
                onConfirm={handleRemoveItem}
                variant="destructive"
                confirmText="Remove"
            />

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {cart.items.map((item) => (
                    <div
                        key={item.id}
                        className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-4 transition-all duration-300 ${updating === item.product.id ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <div className="flex flex-col gap-4">
                            {/* Product Info */}
                            {/* Product Info with Image */}
                            <div className="flex gap-4">
                                {/* Thumbnail */}
                                <Link
                                    href={`/product/${item.product.id}`}
                                    className="relative w-24 h-24 shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100"
                                >
                                    {item.product.thumbnail ? (
                                        <Image
                                            src={item.product.thumbnail}
                                            alt={item.product.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <span className="text-2xl">📦</span>
                                        </div>
                                    )}
                                </Link>

                                <div>
                                    <Link
                                        href={`/product/${item.product.id}`}
                                        className="font-bold text-[#1A1A1A] text-lg mb-1 hover:text-[#C8102E] transition-colors line-clamp-2"
                                    >
                                        {item.product.title}
                                    </Link>
                                    <div className="text-xs font-bold uppercase tracking-wider mt-1">
                                        {item.product.stock > 0 ? (
                                            <span className="text-emerald-600">In stock</span>
                                        ) : (
                                            <span className="text-[#C8102E]">Out of stock</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-[#A9A9A9]">Price</span>
                                <span className="text-lg font-bold text-[#1A1A1A]">
                                    ${(item.product.price / 100).toFixed(2)}
                                </span>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-[#A9A9A9]">Quantity</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                        disabled={updating === item.product.id || item.quantity <= 1}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#A9A9A9] text-[#1A1A1A] font-bold transition-all hover:bg-gray-100 disabled:opacity-30 active:scale-95"
                                    >
                                        −
                                    </button>
                                    <span className="w-10 text-center font-extrabold text-[#1A1A1A] text-lg">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                        disabled={updating === item.product.id || item.quantity >= item.product.stock}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#A9A9A9] text-[#1A1A1A] font-bold transition-all hover:bg-gray-100 disabled:opacity-30 active:scale-95"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Subtotal */}
                            <div className="flex items-center justify-between pt-3 border-t border-[#A9A9A9]/20">
                                <span className="text-sm font-semibold text-[#A9A9A9]">Subtotal</span>
                                <span className="text-xl font-extrabold text-[#C8102E]">
                                    ${((item.product.price * item.quantity) / 100).toFixed(2)}
                                </span>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => openRemoveConfirm(item.product.id)}
                                disabled={updating === item.product.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-[#C8102E] rounded-xl font-bold text-sm transition-all hover:bg-[#C8102E] hover:text-white active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                Remove from Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#FAFAFA] border-bottom-1 border-gray-200">
                                <th className="px-6 py-4 text-left text-sm font-bold text-[#1A1A1A]">PRODUCT</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">PRICE</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-[#1A1A1A]">QUANTITY</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-[#1A1A1A]">SUBTOTAL</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-[#1A1A1A]">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#A9A9A9]/20">
                            {cart.items.map((item) => (
                                <tr
                                    key={item.id}
                                    className={`transition-all duration-300 ${updating === item.product.id ? "opacity-50 pointer-events-none" : "hover:bg-red-50/5"}`}
                                >
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <Link
                                                href={`/product/${item.product.id}`}
                                                className="relative w-16 h-16 shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 group-hover:border-[#C8102E]/20 transition-colors"
                                            >
                                                {item.product.thumbnail ? (
                                                    <Image
                                                        src={item.product.thumbnail}
                                                        alt={item.product.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <span className="text-2xl">📦</span>
                                                    </div>
                                                )}
                                            </Link>

                                            <div>
                                                <Link
                                                    href={`/product/${item.product.id}`}
                                                    className="font-bold text-[#1A1A1A] leading-tight mb-1 line-clamp-2 hover:text-[#C8102E] transition-colors"
                                                >
                                                    {item.product.title}
                                                </Link>
                                                <div className="text-xs font-bold uppercase tracking-wider">
                                                    {item.product.stock > 0 ? (
                                                        <span className="text-emerald-600">In stock</span>
                                                    ) : (
                                                        <span className="text-[#C8102E]">Out of stock</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right font-bold text-[#1A1A1A]">
                                        ${(item.product.price / 100).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                disabled={updating === item.product.id || item.quantity <= 1}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#A9A9A9] text-[#1A1A1A] font-bold transition-all hover:bg-gray-100 disabled:opacity-30"
                                            >
                                                −
                                            </button>
                                            <span className="w-8 text-center font-extrabold text-[#1A1A1A]">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                disabled={updating === item.product.id || item.quantity >= item.product.stock}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#A9A9A9] text-[#1A1A1A] font-bold transition-all hover:bg-gray-100 disabled:opacity-30"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right font-extrabold text-[#C8102E] text-lg">
                                        ${((item.product.price * item.quantity) / 100).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <button
                                            onClick={() => openRemoveConfirm(item.product.id)}
                                            disabled={updating === item.product.id}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-[#C8102E] rounded-lg font-bold text-sm transition-all hover:bg-[#C8102E] hover:text-white group active:scale-95"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                <div className="lg:col-span-2">
                    {/* Add more cart functionality if needed */}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 h-fit space-y-8 sticky top-24">
                    <h2 className="text-2xl font-black text-[#1A1A1A]">
                        Order Summary
                    </h2>

                    {totals && config ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-gray-500 font-medium">
                                <span>Subtotal (Tax included)</span>
                                <span className="text-[#1A1A1A] font-bold">${(totals.subtotal / 100).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-500 font-medium">
                                <span>Shipping</span>
                                {totals.shippingAmount === 0 ? (
                                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">FREE</span>
                                ) : (
                                    <span className="text-[#1A1A1A] font-bold">${(totals.shippingAmount / 100).toFixed(2)}</span>
                                )}
                            </div>

                            <div className="flex justify-between items-center text-gray-400 text-sm">
                                <span>Estimated Tax (Included)</span>
                                <span className="font-medium">${(totals.taxAmount / 100).toFixed(2)}</span>
                            </div>

                            <div className="h-px bg-gray-100 my-4" />

                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-[#1A1A1A]">Order Total</span>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-[#C8102E] block">
                                        ${(totals.total / 100).toFixed(2)}
                                    </span>
                                    {totals.shippingAmount === 0 && config.freeShippingThreshold > 0 && (
                                        <p className="text-xs text-emerald-600 font-bold mt-1">Free Shipping Applied!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center text-gray-400">Loading summary...</div>
                    )}

                    <div className="space-y-4 pt-2">
                        {!hasAddresses ? (
                            <div className="space-y-3">
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm font-bold">Please add a shipping address to proceed.</div>
                                </div>
                                <button
                                    onClick={() => router.push("/profile/addresses")}
                                    className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-bold transition-all hover:bg-[#333] active:scale-95 shadow-lg group relative overflow-hidden"
                                >
                                    Add Address
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push("/cart/checkout")}
                                className="w-full py-4 bg-[#C8102E] text-white rounded-full font-black text-lg transition-all hover:bg-[#A90D27] hover:shadow-[0_8px_30px_rgba(200,16,46,0.25)] active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Proceed to Checkout
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:translate-x-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </span>
                            </button>
                        )}

                        <a
                            href="/products"
                            className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 font-bold hover:text-[#C8102E] transition-colors group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                            Continue Shopping
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
