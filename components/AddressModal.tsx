"use client";

import { useState, useEffect } from "react";
import "./address-modal.css";

export interface Address {
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

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "add" | "edit";
    existingAddress?: Address;
    onSuccess?: () => void;
}

export default function AddressModal({
    isOpen,
    onClose,
    mode,
    existingAddress,
    onSuccess,
}: AddressModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        firstName: "",
        lastName: "",
        phone: "",
        city: "",
        district: "",
        neighborhood: "",
        fullAddress: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Reset form when modal opens or mode/address changes
    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && existingAddress) {
                setFormData({
                    title: existingAddress.title,
                    firstName: existingAddress.firstName,
                    lastName: existingAddress.lastName,
                    phone: existingAddress.phone,
                    city: existingAddress.city,
                    district: existingAddress.district,
                    neighborhood: existingAddress.neighborhood,
                    fullAddress: existingAddress.fullAddress,
                });
            } else {
                setFormData({
                    title: "",
                    firstName: "",
                    lastName: "",
                    phone: "",
                    city: "",
                    district: "",
                    neighborhood: "",
                    fullAddress: "",
                });
            }
            setError("");
        }
    }, [isOpen, mode, existingAddress]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const url =
                mode === "add"
                    ? "/api/address/add"
                    : `/api/address/${existingAddress?.id}`;
            const method = mode === "add" ? "POST" : "PUT";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSuccess?.();
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || "Failed to save address");
            }
        } catch (err) {
            setError("An error occurred while saving the address");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="address-modal-overlay" onClick={handleOverlayClick}>
            <div className="address-modal-content">
                <div className="address-modal-header">
                    <h2>{mode === "add" ? "Add New Address" : "Edit Address"}</h2>
                    <button
                        className="address-modal-close"
                        onClick={onClose}
                        type="button"
                        aria-label="Close modal"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {error && <div className="address-modal-error">{error}</div>}

                <form onSubmit={handleSubmit} className="address-modal-form">
                    <div className="address-form-group">
                        <label htmlFor="title">
                            Title <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Home, Office, etc."
                            required
                            className="address-form-input"
                        />
                    </div>

                    <div className="address-form-row">
                        <div className="address-form-group">
                            <label htmlFor="firstName">
                                First Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                                className="address-form-input"
                            />
                        </div>
                        <div className="address-form-group">
                            <label htmlFor="lastName">
                                Last Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                                className="address-form-input"
                            />
                        </div>
                    </div>

                    <div className="address-form-group">
                        <label htmlFor="phone">
                            Phone <span className="required">*</span>
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="e.g., +90 555 123 4567"
                            required
                            className="address-form-input"
                        />
                    </div>

                    <div className="address-form-row">
                        <div className="address-form-group">
                            <label htmlFor="city">
                                City <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                required
                                className="address-form-input"
                            />
                        </div>
                        <div className="address-form-group">
                            <label htmlFor="district">
                                District <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="district"
                                name="district"
                                value={formData.district}
                                onChange={handleInputChange}
                                required
                                className="address-form-input"
                            />
                        </div>
                    </div>

                    <div className="address-form-group">
                        <label htmlFor="neighborhood">
                            Neighborhood <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="neighborhood"
                            name="neighborhood"
                            value={formData.neighborhood}
                            onChange={handleInputChange}
                            required
                            className="address-form-input"
                        />
                    </div>

                    <div className="address-form-group">
                        <label htmlFor="fullAddress">
                            Full Address <span className="required">*</span>
                        </label>
                        <textarea
                            id="fullAddress"
                            name="fullAddress"
                            value={formData.fullAddress}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Street, building number, apartment, etc."
                            required
                            className="address-form-textarea"
                        />
                    </div>

                    <div className="address-modal-footer">
                        <button
                            type="button"
                            className="address-btn-cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="address-btn-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="address-btn-spinner"></div>
                                    Saving...
                                </>
                            ) : mode === "add" ? (
                                "Add Address"
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
