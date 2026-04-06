"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AddressModal from "@@/components/AddressModal";
import "./address-selection.css";
import { useTranslations } from "next-intl";
import { useCurrency } from "@@/context/CurrencyContext";
import { useCart } from "@@/context/CartContext";

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
    const t = useTranslations("paymentCheckout");
    const { formatPrice } = useCurrency();
    const { refreshCart } = useCart();
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
            setUploadError(t("invalidFileType"));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError(t("fileTooLarge"));
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
                throw new Error(data.error || t("failedToUpload"));
            }

            await refreshCart();
            router.push(`/checkout/success?orderId=${orderId}`);
        } catch (error) {
            console.error("Upload error:", error);
            setUploadError(error instanceof Error ? error.message : t("failedToUploadRetry"));
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
                <p>{t("loading")}</p>
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
                    <h2>{t("noAddressFound")}</h2>
                    <p>{t("noAddressDesc")}</p>
                    <button
                        className="btn-add-address-primary"
                        onClick={() => router.push("/profile/addresses")}
                    >
                        {t("addAddress")}
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
                    <div className="step-label">{t("deliveryAddress")}</div>
                </div>
                <div className="step-divider"></div>
                <div className={`step ${currentStep === "payment" ? "active" : ""}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">{t("bankTransfer")}</div>
                </div>
            </div>

            {/* Address Selection Step */}
            {currentStep === "address" && (
                <div className="address-selection-step">
                    <h2 className="section-title">{t("selectDeliveryAddress")}</h2>

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
                                            {t("edit")}
                                        </button>
                                    </div>
                                    <div className="address-info">
                                        <div className="info-row">
                                            <span className="info-label">{t("name")}</span>
                                            <span className="info-value">{address.firstName} {address.lastName}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">{t("phone")}</span>
                                            <span className="info-value">{maskPhone(address.phone)}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">{t("location")}</span>
                                            <span className="info-value">{address.neighborhood}, {address.district}, {address.city}</span>
                                        </div>
                                        <div className="info-row full-width">
                                            <span className="info-label">{t("address")}</span>
                                            <span className="info-value">{address.fullAddress}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ paddingTop: "0.75rem" }}>
                        <a
                            href="/profile/addresses"
                            className="btn-add-address-link"
                        >
                            {t("addAnotherAddress")}
                        </a>
                    </div>

                    <div className="address-actions">
                        <button className="btn-secondary" onClick={() => router.push("/cart")}>
                            {t("backToCart")}
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleContinueToPayment}
                            disabled={!selectedAddressId}
                        >
                            {t("continueToPayment")}
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
                            <h3>{t("deliveryAddress")}</h3>
                            <button className="btn-change" onClick={() => setCurrentStep("address")}>
                                {t("change")}
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
                                <strong>{t("paymentRejected")}</strong> {t("paymentRejectedDesc")}
                            </p>
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="order-summary-card">
                        <h2>{t("orderSummary")}</h2>

                        <div className="order-id">
                            <span className="label">{t("orderId")}</span>
                            <span className="value">{order.id}</span>
                        </div>

                        <table className="order-table">
                            <thead>
                                <tr>
                                    <th>{t("product")}</th>
                                    <th>{t("qty")}</th>
                                    <th>{t("price")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.product.title}</td>
                                        <td>{item.quantity}</td>
                                        <td>{formatPrice(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                {(() => {
                                    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                                    const shipping = order.total - subtotal;
                                    return (
                                        <>
                                            <tr>
                                                <td colSpan={2}>{t("subtotal")}</td>
                                                <td>{formatPrice(subtotal)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={2}>{t("shipping")}</td>
                                                <td>{shipping > 0 ? formatPrice(shipping) : t("free")}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={2}>{t("total")}</td>
                                                <td className="total-amount">{formatPrice(order.total)}</td>
                                            </tr>
                                        </>
                                    );
                                })()}
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
                                {t("bankTransferDetails")}
                            </h3>
                            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#555" }}>
                                Please transfer <strong>{formatPrice(order.total)}</strong> to the
                                following account, then upload your receipt below.
                            </p>

                            <div style={{ display: "grid", gap: "10px" }}>
                                {bankDetails.bankName && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 14px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{t("bankName")}</div>
                                            <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bankDetails.bankName}</div>
                                        </div>
                                        <button onClick={() => copyToClipboard(bankDetails.bankName)} style={{ flexShrink: 0, background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666" }}>{t("copy")}</button>
                                    </div>
                                )}
                                {bankDetails.accountHolder && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 14px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{t("accountHolder")}</div>
                                            <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bankDetails.accountHolder}</div>
                                        </div>
                                        <button onClick={() => copyToClipboard(bankDetails.accountHolder)} style={{ flexShrink: 0, background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666" }}>{t("copy")}</button>
                                    </div>
                                )}
                                {bankDetails.iban && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", padding: "10px 14px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{t("iban")}</div>
                                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a", fontFamily: "monospace", wordBreak: "break-all", letterSpacing: "0.5px" }}>{bankDetails.iban}</div>
                                        </div>
                                        <button onClick={() => copyToClipboard(bankDetails.iban)} style={{ flexShrink: 0, background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666", marginTop: "2px" }}>{t("copy")}</button>
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
                        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>{t("uploadPaymentProof")}</h3>
                        <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#555" }}>
                            {t("uploadInstruction")}
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
                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>{t("clickToChange")}</p>
                                </div>
                            ) : selectedFile ? (
                                <div>
                                    <p style={{ margin: 0, fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>{selectedFile.name}</p>
                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>{t("clickToChange")}</p>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ margin: 0, fontSize: "15px", color: "#999" }}>{t("clickToSelect")}</p>
                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#bbb" }}>{t("acceptedFormats")}</p>
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
                            {t("back")}
                        </button>
                        <button
                            className="btn-pay"
                            onClick={handleUpload}
                            disabled={uploading || !selectedFile}
                        >
                            {uploading ? t("uploading") : t("submitPaymentProof")}
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
