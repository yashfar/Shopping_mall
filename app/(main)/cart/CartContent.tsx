"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@@/context/CartContext";
import { toast } from "sonner";
import { ConfirmDialog } from "@@/components/ConfirmDialog";

type CartItem = {
    id: string;
    quantity: number;
    product: {
        id: string;
        title: string;
        price: number;
        stock: number;
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
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-[#A9A9A9] rounded-2xl shadow-sm text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-[#C8102E]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-2">Your cart is empty</h2>
                <p className="text-[#A9A9A9] mb-8 max-w-sm">Looks like you haven't added anything to your cart yet. Explore our products and find something you love!</p>
                <a
                    href="/products"
                    className="inline-flex items-center px-8 py-3.5 bg-[#C8102E] text-white rounded-xl font-bold transition-all duration-300 hover:bg-[#A90D27] hover:shadow-lg active:scale-95"
                >
                    Start Shopping
                </a>
            </div>
        );
    }

    const total = cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

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

            <div className="bg-white rounded-2xl border border-[#A9A9A9] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#FAFAFA] border-bottom-1 border-[#A9A9A9]">
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
                                        <div className="font-bold text-[#1A1A1A] leading-tight mb-1">{item.product.title}</div>
                                        <div className="text-xs font-bold uppercase tracking-wider">
                                            {item.product.stock > 0 ? (
                                                <span className="text-emerald-600">In stock</span>
                                            ) : (
                                                <span className="text-[#C8102E]">Out of stock</span>
                                            )}
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

                <div className="bg-white rounded-2xl border border-[#A9A9A9] shadow-sm p-8 h-fit space-y-6">
                    <h2 className="text-xl font-extrabold text-[#1A1A1A] flex items-center gap-2">
                        Summary
                    </h2>

                    <div className="space-y-4 pt-4 border-t border-[#A9A9A9]/20">
                        <div className="flex justify-between items-center text-[#A9A9A9] font-bold">
                            <span>Subtotal</span>
                            <span className="text-[#1A1A1A]">${(total / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[#A9A9A9] font-bold">
                            <span>Shipping</span>
                            <span className="text-emerald-600">FREE</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t-2 border-[#1A1A1A]">
                            <span className="text-xl font-extrabold text-[#1A1A1A]">Total</span>
                            <span className="text-2xl font-black text-[#C8102E]">
                                ${(total / 100).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {!hasAddresses ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-red-50 border border-[#C8102E]/20 rounded-xl text-center">
                                    <p className="text-xs font-bold text-[#C8102E]">
                                        ⚠️ Please add a shipping address to proceed.
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push("/profile/addresses")}
                                    className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-bold transition-all hover:bg-[#C8102E] active:scale-95 shadow-md"
                                >
                                    Add Shipping Address
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push("/cart/checkout")}
                                className="w-full py-4 bg-[#C8102E] text-white rounded-xl font-black text-lg transition-all hover:bg-[#A90D27] hover:shadow-[0_8px_20px_rgba(200,16,46,0.3)] active:scale-95 flex items-center justify-center gap-2"
                            >
                                Checkout
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        )}
                        <a
                            href="/products"
                            className="block w-full text-center py-4 bg-[#FAFAFA] text-[#1A1A1A] border border-[#A9A9A9] rounded-xl font-bold transition-all hover:bg-white hover:border-[#C8102E] hover:text-[#C8102E]"
                        >
                            Continue Shopping
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
