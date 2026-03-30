"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
    id: string;
    quantity: number;
    price: number;
    product: {
        title: string;
    };
};

type Order = {
    id: string;
    total: number;
    status: string;
    items: OrderItem[];
    paymentProofUrl?: string | null;
};

type BankDetails = {
    bankName: string;
    accountHolder: string;
    iban: string;
    bankTransferNote: string;
};

export default function PaymentCheckout({ orderId }: { orderId: string }) {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orderRes, bankRes] = await Promise.all([
                    fetch(`/api/orders/${orderId}`),
                    fetch("/api/bank-details"),
                ]);

                if (!orderRes.ok) throw new Error("Failed to fetch order");
                const orderData = await orderRes.json();
                setOrder(orderData.order);

                // If order already has proof uploaded or is paid, redirect
                if (orderData.order.status === "PAYMENT_UPLOADED") {
                    router.push(`/checkout/success?orderId=${orderId}`);
                    return;
                }
                if (!["PENDING", "PAYMENT_REJECTED"].includes(orderData.order.status)) {
                    router.push(`/orders/${orderId}`);
                    return;
                }

                if (bankRes.ok) {
                    const bankData = await bankRes.json();
                    setBankDetails(bankData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                router.push("/orders");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orderId, router]);

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
        if (!selectedFile) return;

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

    if (loading) {
        return <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>;
    }

    if (!order) {
        return null;
    }

    const isRejected = order.status === "PAYMENT_REJECTED";

    return (
        <div>
            {/* Rejection Notice */}
            {isRejected && (
                <div
                    style={{
                        backgroundColor: "#fef2f2",
                        padding: "16px 20px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        border: "1px solid #fecaca",
                    }}
                >
                    <p style={{ margin: 0, fontSize: "14px", color: "#991b1b" }}>
                        <strong>Payment Rejected:</strong> Your previous payment proof was not approved.
                        Please upload a new receipt below.
                    </p>
                </div>
            )}

            {/* Order Summary */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginBottom: "24px",
                }}
            >
                <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Order Summary</h2>

                <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Order ID</div>
                    <div style={{ fontFamily: "monospace", fontSize: "14px" }}>{order.id}</div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                            <th style={{ padding: "12px", textAlign: "left" }}>Product</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>Qty</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "12px" }}>{item.product.title}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{item.quantity}</td>
                                <td style={{ padding: "12px", textAlign: "right" }}>
                                    ${((item.price * item.quantity) / 100).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ borderTop: "2px solid #ddd" }}>
                            <td colSpan={2} style={{ padding: "16px", textAlign: "right", fontWeight: "700" }}>
                                Total:
                            </td>
                            <td
                                style={{
                                    padding: "16px",
                                    textAlign: "right",
                                    fontSize: "24px",
                                    fontWeight: "700",
                                    color: "#0070f3",
                                }}
                            >
                                ${(order.total / 100).toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Bank Transfer Details */}
            {bankDetails && (bankDetails.bankName || bankDetails.iban) && (
                <div
                    style={{
                        backgroundColor: "#f0f9ff",
                        padding: "24px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        border: "1px solid #bae6fd",
                    }}
                >
                    <h3 style={{ margin: "0 0 16px 0", color: "#0369a1" }}>
                        Bank Transfer Details
                    </h3>
                    <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#555" }}>
                        Please transfer <strong>${(order.total / 100).toFixed(2)}</strong> to the
                        following bank account, then upload your payment receipt below.
                    </p>

                    <div style={{ display: "grid", gap: "12px" }}>
                        {bankDetails.bankName && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
                                <div>
                                    <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Bank Name</div>
                                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>{bankDetails.bankName}</div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(bankDetails.bankName)}
                                    style={{ background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666" }}
                                >
                                    Copy
                                </button>
                            </div>
                        )}

                        {bankDetails.accountHolder && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
                                <div>
                                    <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Account Holder</div>
                                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>{bankDetails.accountHolder}</div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(bankDetails.accountHolder)}
                                    style={{ background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666" }}
                                >
                                    Copy
                                </button>
                            </div>
                        )}

                        {bankDetails.iban && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
                                <div>
                                    <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>IBAN</div>
                                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a", fontFamily: "monospace", letterSpacing: "1px" }}>{bankDetails.iban}</div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(bankDetails.iban)}
                                    style={{ background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "12px", color: "#666" }}
                                >
                                    Copy
                                </button>
                            </div>
                        )}
                    </div>

                    {bankDetails.bankTransferNote && (
                        <p style={{ margin: "16px 0 0 0", fontSize: "13px", color: "#6b7280", fontStyle: "italic" }}>
                            {bankDetails.bankTransferNote}
                        </p>
                    )}
                </div>
            )}

            {/* Upload Payment Proof */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginBottom: "24px",
                }}
            >
                <h3 style={{ margin: "0 0 16px 0" }}>Upload Payment Proof</h3>
                <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#555" }}>
                    After completing your bank transfer, upload a screenshot or photo of your
                    payment receipt. Accepted formats: JPG, PNG, WebP, PDF (max 5MB).
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
                        padding: "32px",
                        textAlign: "center",
                        cursor: "pointer",
                        backgroundColor: selectedFile ? "#f0fdf4" : "#fafafa",
                        transition: "all 0.2s",
                    }}
                >
                    {previewUrl ? (
                        <div>
                            <img
                                src={previewUrl}
                                alt="Payment proof preview"
                                style={{ maxWidth: "300px", maxHeight: "200px", borderRadius: "4px", marginBottom: "8px" }}
                            />
                            <p style={{ margin: 0, fontSize: "14px", color: "#16a34a", fontWeight: 600 }}>
                                {selectedFile?.name}
                            </p>
                            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}>
                                Click to change file
                            </p>
                        </div>
                    ) : selectedFile ? (
                        <div>
                            <p style={{ margin: 0, fontSize: "14px", color: "#16a34a", fontWeight: 600 }}>
                                {selectedFile.name}
                            </p>
                            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}>
                                Click to change file
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p style={{ margin: 0, fontSize: "16px", color: "#999" }}>
                                Click to select your payment receipt
                            </p>
                            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#bbb" }}>
                                JPG, PNG, WebP, or PDF (max 5MB)
                            </p>
                        </div>
                    )}
                </div>

                {uploadError && (
                    <p style={{ margin: "12px 0 0 0", color: "#dc2626", fontSize: "14px" }}>
                        {uploadError}
                    </p>
                )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
                <button
                    onClick={() => router.push("/orders")}
                    disabled={uploading}
                    style={{
                        flex: 1,
                        padding: "14px",
                        backgroundColor: "#f5f5f5",
                        color: "#333",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        cursor: uploading ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                        opacity: uploading ? 0.5 : 1,
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile}
                    style={{
                        flex: 2,
                        padding: "14px",
                        backgroundColor: uploading || !selectedFile ? "#ccc" : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: uploading || !selectedFile ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                    }}
                >
                    {uploading ? "Uploading..." : "Submit Payment Proof"}
                </button>
            </div>
        </div>
    );
}
