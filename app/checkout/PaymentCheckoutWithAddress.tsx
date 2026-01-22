"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddressModal from "@@/components/AddressModal";
import "./address-selection.css";

interface Address {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    fullAddress: string;
    createdAt: string;
    updatedAt: string;
}

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    product: {
        title: string;
    };
}

interface Order {
    id: string;
    total: number;
    status: string;
    items: OrderItem[];
}

export default function PaymentCheckoutWithAddress({ orderId }: { orderId: string }) {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [paying, setPaying] = useState(false);
    const [currentStep, setCurrentStep] = useState<"address" | "payment">("address");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (!response.ok) throw new Error("Failed to fetch order");
                const data = await response.json();
                setOrder(data.order);

                // If order is not pending, redirect
                if (data.order.status !== "PENDING") {
                    router.push(`/orders/${orderId}`);
                }
            } catch (error) {
                console.error("Error fetching order:", error);
                router.push("/orders");
            } finally {
                setLoading(false);
            }
        };

        const fetchAddresses = async () => {
            try {
                setLoadingAddresses(true);
                const response = await fetch("/api/address/list");
                if (response.ok) {
                    const data = await response.json();
                    setAddresses(data.addresses || []);
                }
            } catch (error) {
                console.error("Error fetching addresses:", error);
            } finally {
                setLoadingAddresses(false);
            }
        };

        fetchOrder();
        fetchAddresses();
    }, [orderId, router]);

    const maskPhone = (phone: string) => {
        if (phone.length < 4) return phone;
        return phone.slice(0, 3) + "*****" + phone.slice(-2);
    };

    const fetchAddresses = async () => {
        try {
            setLoadingAddresses(true);
            const response = await fetch("/api/address/list");
            if (response.ok) {
                const data = await response.json();
                setAddresses(data.addresses || []);
            }
        } catch (error) {
            console.error("Error fetching addresses:", error);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleEditAddress = (address: Address, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection when clicking edit
        setEditingAddress(address);
        setIsEditModalOpen(true);
    };

    const handleModalSuccess = () => {
        fetchAddresses(); // Refresh addresses after edit
    };

    const handleContinueToPayment = () => {
        if (selectedAddressId) {
            setCurrentStep("payment");
        }
    };

    const handlePayment = async () => {
        if (!selectedAddressId) {
            alert("Please select a delivery address");
            return;
        }

        try {
            setPaying(true);
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    addressId: selectedAddressId
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create checkout session");
            }

            const data = await response.json();

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error("Error creating checkout session:", error);
            alert(error.message || "Failed to proceed to payment");
            setPaying(false);
        }
    };

    if (loading || loadingAddresses) {
        return (
            <div className="checkout-loading">
                <div className="spinner"></div>
                <p>Loading checkout...</p>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    // No addresses - Block checkout
    if (addresses.length === 0) {
        return (
            <div className="no-address-container">
                <div className="no-address-card">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="no-address-icon"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                    </svg>
                    <h2>No address found</h2>
                    <p>Please add an address before checkout.</p>
                    <button
                        className="btn-add-address-primary"
                        onClick={() => router.push("/profile/addresses")}
                    >
                        Add Address
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-checkout-container">
            {/* Progress Steps */}
            <div className="checkout-steps">
                <div className={`step ${currentStep === "address" ? "active" : "completed"}`}>
                    <div className="step-number">1</div>
                    <div className="step-label">Delivery Address</div>
                </div>
                <div className="step-divider"></div>
                <div className={`step ${currentStep === "payment" ? "active" : ""}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">Payment</div>
                </div>
            </div>

            {/* Address Selection Step */}
            {currentStep === "address" && (
                <div className="address-selection-step">
                    <h2 className="section-title">Select Delivery Address</h2>

                    <div className="address-cards-grid">
                        {addresses.map((address) => (
                            <div
                                key={address.id}
                                className={`address-selection-card ${selectedAddressId === address.id ? "selected" : ""
                                    }`}
                                onClick={() => setSelectedAddressId(address.id)}
                            >
                                <div className="radio-container">
                                    <input
                                        type="radio"
                                        name="address"
                                        value={address.id}
                                        checked={selectedAddressId === address.id}
                                        onChange={() => setSelectedAddressId(address.id)}
                                        className="address-radio"
                                    />
                                </div>
                                <div className="address-details">
                                    <div className="address-header">
                                        <h3 className="address-title-badge">{address.title}</h3>
                                        <button
                                            className="btn-edit-address"
                                            onClick={(e) => handleEditAddress(address, e)}
                                            title="Edit address"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="edit-icon"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                                />
                                            </svg>
                                            Edit
                                        </button>
                                    </div>
                                    <div className="address-info">
                                        <div className="info-row">
                                            <span className="info-label">Name:</span>
                                            <span className="info-value">
                                                {address.firstName} {address.lastName}
                                            </span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Phone:</span>
                                            <span className="info-value">{maskPhone(address.phone)}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Location:</span>
                                            <span className="info-value">
                                                {address.neighborhood}, {address.district}, {address.city}
                                            </span>
                                        </div>
                                        <div className="info-row full-width">
                                            <span className="info-label">Address:</span>
                                            <span className="info-value">{address.fullAddress}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="address-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => router.push("/cart")}
                        >
                            ← Back to Cart
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleContinueToPayment}
                            disabled={!selectedAddressId}
                        >
                            Continue to Payment
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Step */}
            {currentStep === "payment" && (
                <div className="payment-step">
                    {/* Selected Address Summary */}
                    <div className="selected-address-summary">
                        <div className="summary-header">
                            <h3>Delivery Address</h3>
                            <button
                                className="btn-change"
                                onClick={() => setCurrentStep("address")}
                            >
                                Change
                            </button>
                        </div>
                        {addresses.find((a) => a.id === selectedAddressId) && (
                            <div className="summary-content">
                                {(() => {
                                    const addr = addresses.find((a) => a.id === selectedAddressId)!;
                                    return (
                                        <>
                                            <p className="summary-name">
                                                <strong>{addr.title}</strong> - {addr.firstName} {addr.lastName}
                                            </p>
                                            <p className="summary-text">
                                                {addr.fullAddress}, {addr.neighborhood}, {addr.district}, {addr.city}
                                            </p>
                                            <p className="summary-text">{maskPhone(addr.phone)}</p>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary-card">
                        <h2>Order Summary</h2>

                        <div className="order-id">
                            <span className="label">Order ID:</span>
                            <span className="value">{order.id}</span>
                        </div>

                        <table className="order-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.product.title}</td>
                                        <td>{item.quantity}</td>
                                        <td>${((item.price * item.quantity) / 100).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2}>Total:</td>
                                    <td className="total-amount">${(order.total / 100).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment Info */}
                    <div className="payment-info-box">
                        <p>
                            🔒 <strong>Secure Payment:</strong> You will be redirected to Stripe's secure payment page.
                            We accept all major credit cards.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="payment-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => setCurrentStep("address")}
                            disabled={paying}
                        >
                            ← Back
                        </button>
                        <button
                            className="btn-pay"
                            onClick={handlePayment}
                            disabled={paying}
                        >
                            {paying ? "Redirecting to Payment..." : "Pay Now"}
                        </button>
                    </div>
                </div>
            )}

            {/* Address Edit Modal */}
            <AddressModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                mode="edit"
                existingAddress={editingAddress || undefined}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
