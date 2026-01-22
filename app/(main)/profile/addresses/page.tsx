"use client";

import { useState, useEffect } from "react";
import AddressModal, { Address } from "@@/components/AddressModal";
import "./addresses.css";

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/address/list");
            if (response.ok) {
                const data = await response.json();
                setAddresses(data.addresses);
            } else {
                setError("Failed to load addresses");
            }
        } catch (err) {
            setError("An error occurred while loading addresses");
        } finally {
            setLoading(false);
        }
    };

    const maskPhone = (phone: string) => {
        if (phone.length < 4) return phone;
        return phone.slice(0, 3) + "****" + phone.slice(-2);
    };

    const openAddModal = () => {
        setModalMode("add");
        setEditingAddress(null);
        setIsModalOpen(true);
    };

    const openEditModal = (address: Address) => {
        setModalMode("edit");
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAddress(null);
        setError("");
    };

    const handleModalSuccess = () => {
        fetchAddresses();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            const response = await fetch(`/api/address/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                await fetchAddresses();
            } else {
                alert("Failed to delete address");
            }
        } catch (err) {
            alert("An error occurred while deleting the address");
        }
    };

    if (loading) {
        return (
            <div className="addresses-page">
                <div className="addresses-container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading addresses...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="addresses-page">
            <div className="addresses-container">
                <div className="addresses-header">
                    <h1>Your Addresses</h1>
                    <button className="btn-add-address" onClick={openAddModal}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="icon"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Add New Address
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {addresses.length === 0 ? (
                    <div className="empty-state">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="empty-icon"
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
                        <h2>No addresses yet</h2>
                        <p>Add your first address to make checkout faster</p>
                        <button className="btn-add-first" onClick={openAddModal}>
                            Add Address
                        </button>
                    </div>
                ) : (
                    <div className="addresses-grid">
                        {addresses.map((address) => (
                            <div key={address.id} className="address-card">
                                <div className="address-card-header">
                                    <h3 className="address-title">{address.title}</h3>
                                </div>
                                <div className="address-card-body">
                                    <div className="address-field">
                                        <span className="field-label">Full Name</span>
                                        <span className="field-value">
                                            {address.firstName} {address.lastName}
                                        </span>
                                    </div>
                                    <div className="address-field">
                                        <span className="field-label">Phone</span>
                                        <span className="field-value">
                                            {maskPhone(address.phone)}
                                        </span>
                                    </div>
                                    <div className="address-field">
                                        <span className="field-label">City</span>
                                        <span className="field-value">{address.city}</span>
                                    </div>
                                    <div className="address-field">
                                        <span className="field-label">District</span>
                                        <span className="field-value">{address.district}</span>
                                    </div>
                                    <div className="address-field">
                                        <span className="field-label">Neighborhood</span>
                                        <span className="field-value">{address.neighborhood}</span>
                                    </div>
                                    <div className="address-field full-width">
                                        <span className="field-label">Full Address</span>
                                        <span className="field-value">{address.fullAddress}</span>
                                    </div>
                                </div>
                                <div className="address-card-footer">
                                    <button
                                        className="btn-edit"
                                        onClick={() => openEditModal(address)}
                                    >
                                        Edit Address
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(address.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reusable Address Modal */}
                <AddressModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    mode={modalMode}
                    existingAddress={editingAddress || undefined}
                    onSuccess={handleModalSuccess}
                />
            </div>
        </div>
    );
}
