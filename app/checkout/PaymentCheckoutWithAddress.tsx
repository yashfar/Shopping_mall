"use client";

import { useEffect, useState, useRef } from "react";
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

interface BankDetails {
    bankName: string;
    accountHolder: string;
    iban: string;
    bankTransferNote: string;
}

export default function PaymentCheckoutWithAddress({ orderId }: { orderId: string }) {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [currentStep, setCurrentStep] = useState<"address" | "payment">("address");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    // Bank transfer state
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (!response.ok) throw new Error("Failed to fetch order");
                const data = await response.json();
                setOrder(data.order);

                if (data.order.status === "PAYMENT_UPLOADED") {
                    router.push(`/checkout/success?orderId=${orderId}`);
                    return;
                }
                if (!["PENDING", "PAYMENT_REJECTED"].includes(data.order.status)) {
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

        const fetchBankDetails = async () => {
            try {
                const response = await fetch("/api/bank-details");
                if (response.ok) {
                    const data = await response.json();
                    setBankDetails(data);
                }
            } catch (error) {
                console.error("Error fetching bank details:", error);
            }
        };

        fetchOrder();
        fetchAddresses();
        fetchBankDetails();
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
        e.stopPropagation();
        setEditingAddress(address);
        setIsEditModalOpen(true);
    };

    const handleModalSuccess = () => {
        fetchAddresses();
    };

    const handleContinueToPayment = () => {
        if (selectedAddressId) {
            setCurrentStep("payment");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError("");
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            setUploadError("Please upload an image (JPG, PNG, WebP) or PDF file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError("File is too large. Maximum size is 5MB.");
            return;
        }

        setSelectedFile(file);

        if (file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedAddressId) return;

        setUploading(true);
        setUploadError("");

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch(`/api/orders/${orderId}/upload-payment`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to upload payment proof");
            }

            router.push(`/checkout/success?orderId=${orderId}`);
        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadError(error.message || "Failed to upload. Please try again.");
            setUploading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
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

    const isRejected = order.status === "PAYMENT_REJECTED";

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
                    <div className="step-label">Bank Transfer</div>
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
                                className={`address-selection-card ${selectedAddressId === address.id ? "selected" : ""}`}
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
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="edit-icon">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                            Edit
                                        </button>
                                    </div>
                                    <div className="address-info">
                                        <div className="info-row">
                                            <span className="info-label">Name:</span>
                                            <span className="info-value">{address.firstName} {address.lastName}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Phone:</span>
                                            <span className="info-value">{maskPhone(address.phone)}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Location:</span>
                                            <span className="info-value">{address.neighborhood}, {address.district}, {address.city}</span>
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
                        <button className="btn-secondary" onClick={() => router.push("/cart")}>
                            &larr; Back to Cart
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

            {/* Payment Step - Bank Transfer */}
            {currentStep === "payment" && (
                <div className="payment-step">
                    {/* Selected Address Summary */}
                    <div className="selected-address-summary">
                        <div className="summary-header">
                            <h3>Delivery Address</h3>
                            <button className="btn-change" onClick={() => setCurrentStep("address")}>
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

                    {/* Rejection Notice */}
                    {isRejected && (
                        <div style={{
                            backgroundColor: "#fef2f2",
                            padding: "16px 20px",
                            borderRadius: "8px",
                            marginBottom: "16px",
                            border: "1px solid #fecaca",
                        }}>
                            <p style={{ margin: 0, fontSize: "14px", color: "#991b1b" }}>
                                <strong>Payment Rejected:</strong> Your previous payment proof was not approved.
                                Please upload a new receipt below.
                            </p>
                        </div>
                    )}

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

                    {/* Bank Transfer Details */}
                    {bankDetails && (bankDetails.bankName || bankDetails.iban) && (
                        <div style={{
                            backgroundColor: "#f0f9ff",
                            padding: "24px",
                            borderRadius: "8px",
                            marginBottom: "16px",
                            border: "1px solid #bae6fd",
                        }}>
                            <h3 style={{ margin: "0 0 12px 0", color: "#0369a1", fontSize: "16px" }}>
                                Bank Transfer Details
                            </h3>
                            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#555" }}>
                                Please transfer <strong>${(order.total / 100).toFixed(2)}</strong> to the
                                following account, then upload your receipt below.
                            </p>

                            <div style={{ display: "grid", gap: "10px" }}>
                                {bankDetails.bankName && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
                                        <div>
                                            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Bank Name</div>
                                            <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>{bankDetails.bankName}</div>
                                        </div>
                                        <button onClick={() => copyToClipboard(bankDetails.bankName)} style={{ background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666" }}>Copy</button>
                                    </div>
                                )}
                                {bankDetails.accountHolder && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
                                        <div>
                                            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Account Holder</div>
                                            <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>{bankDetails.accountHolder}</div>
                                        </div>
                                        <button onClick={() => copyToClipboard(bankDetails.accountHolder)} style={{ background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666" }}>Copy</button>
                                    </div>
                                )}
                                {bankDetails.iban && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
                                        <div>
                                            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>IBAN</div>
                                            <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a", fontFamily: "monospace", letterSpacing: "1px" }}>{bankDetails.iban}</div>
                                        </div>
                                        <button onClick={() => copyToClipboard(bankDetails.iban)} style={{ background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666" }}>Copy</button>
                                    </div>
                                )}
                            </div>

                            {bankDetails.bankTransferNote && (
                                <p style={{ margin: "12px 0 0 0", fontSize: "13px", color: "#6b7280", fontStyle: "italic" }}>
                                    {bankDetails.bankTransferNote}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Upload Payment Proof */}
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        padding: "20px",
                        border: "1px solid #e5e7eb",
                        marginBottom: "16px",
                    }}>
                        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>Upload Payment Proof</h3>
                        <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#555" }}>
                            Upload a screenshot or photo of your payment receipt. Accepted: JPG, PNG, WebP, PDF (max 5MB).
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: "2px dashed #ccc",
                                borderRadius: "8px",
                                padding: "24px",
                                textAlign: "center",
                                cursor: "pointer",
                                backgroundColor: selectedFile ? "#f0fdf4" : "#fafafa",
                            }}
                        >
                            {previewUrl ? (
                                <div>
                                    <img src={previewUrl} alt="Preview" style={{ maxWidth: "250px", maxHeight: "150px", borderRadius: "4px", marginBottom: "8px" }} />
                                    <p style={{ margin: 0, fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>{selectedFile?.name}</p>
                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>Click to change</p>
                                </div>
                            ) : selectedFile ? (
                                <div>
                                    <p style={{ margin: 0, fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>{selectedFile.name}</p>
                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>Click to change</p>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ margin: 0, fontSize: "15px", color: "#999" }}>Click to select your payment receipt</p>
                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#bbb" }}>JPG, PNG, WebP, or PDF (max 5MB)</p>
                                </div>
                            )}
                        </div>

                        {uploadError && (
                            <p style={{ margin: "10px 0 0", color: "#dc2626", fontSize: "13px" }}>{uploadError}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="payment-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => setCurrentStep("address")}
                            disabled={uploading}
                        >
                            &larr; Back
                        </button>
                        <button
                            className="btn-pay"
                            onClick={handleUpload}
                            disabled={uploading || !selectedFile}
                        >
                            {uploading ? "Uploading..." : "Submit Payment Proof"}
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
