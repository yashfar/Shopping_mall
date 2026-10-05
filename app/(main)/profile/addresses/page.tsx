"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AddressModal, { Address } from "@@/components/AddressModal";
import { ConfirmDialog } from "@@/components/ConfirmDialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ArrowRight, MapPin, Pencil, Phone, Plus, Trash2, UserRound } from "lucide-react";
import "./addresses.css";

function AddressesContent() {
    const t = useTranslations("addresses");
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchAddresses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/address/list");
            if (response.ok) {
                const data = await response.json();
                setAddresses(data.addresses);
            } else {
                setError(t("failedToLoad"));
            }
        } catch {
            setError(t("failedToLoadError"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

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
        toast.success(modalMode === "add" ? t("addressAdded") : t("addressUpdated"));
        fetchAddresses();
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDeleteAction = async () => {
        if (!deleteId) return;

        try {
            const response = await fetch(`/api/address/${deleteId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success(t("addressDeleted"));
                await fetchAddresses();
            } else {
                toast.error(t("failedToDelete"));
            }
        } catch {
            toast.error(t("failedToDeleteError"));
        } finally {
            setDeleteId(null);
        }
    };

    if (loading) {
        return (
            <div className="addresses-page">
                <div className="addresses-container">
                    <div className="loading-state">
                        <div className="address-loading-spinner"></div>
                        <p>{t("loading")}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="addresses-page">
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(v) => !v && setDeleteId(null)}
                title={t("deleteAddressTitle")}
                description={t("deleteAddressDesc")}
                onConfirm={confirmDeleteAction}
                variant="destructive"
                confirmText={t("delete")}
            />

            <div className="addresses-container">
                <div className="addresses-header">
                    <div className="addresses-heading">
                        <span className="addresses-heading-icon" aria-hidden="true">
                            <MapPin />
                        </span>
                        <div>
                            <h1>{t("title")}</h1>
                            <p>{t("pageDescription")}</p>
                        </div>
                    </div>
                    <div className="addresses-header-actions">
                        {callbackUrl && addresses.length > 0 && (
                            <button
                                className="btn-continue-checkout"
                                onClick={() => router.push(callbackUrl)}
                            >
                                {t("continueToCheckout")}
                                <ArrowRight className="icon" aria-hidden="true" />
                            </button>
                        )}
                        <button className="btn-add-address" onClick={openAddModal}>
                            <Plus className="icon" aria-hidden="true" />
                            {t("addNewAddress")}
                        </button>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                {addresses.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon-wrap" aria-hidden="true">
                            <MapPin className="empty-icon" />
                        </span>
                        <h2>{t("noAddresses")}</h2>
                        <p>{t("noAddressesDesc")}</p>
                        <button className="btn-add-first" onClick={openAddModal}>
                            <Plus className="icon" aria-hidden="true" />
                            {t("addAddress")}
                        </button>
                    </div>
                ) : (
                    <div className="addresses-grid">
                        {addresses.map((address) => (
                            <article key={address.id} className="address-card">
                                <div className="address-card-header">
                                    <div className="address-card-identity">
                                        <span className="address-card-marker" aria-hidden="true">
                                            <MapPin />
                                        </span>
                                        <div className="address-card-title-row">
                                            <h3 className="address-title">{address.title}</h3>
                                            <span className="address-card-badge">{t("addressLabel")}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="address-card-body">
                                    <div className="address-summary-row address-summary-name">
                                        <UserRound aria-hidden="true" />
                                        <span>
                                            {address.firstName} {address.lastName}
                                        </span>
                                    </div>
                                    <div className="address-summary-row address-summary-phone">
                                        <Phone aria-hidden="true" />
                                        <span>{maskPhone(address.phone)}</span>
                                    </div>
                                    <div className="address-summary-row address-location-line">
                                        <MapPin aria-hidden="true" />
                                        <span>
                                            {address.neighborhood}, {address.district} / {address.city}
                                        </span>
                                    </div>
                                    <address className="address-street">{address.fullAddress}</address>
                                </div>
                                <div className="address-card-actions">
                                    <button
                                        type="button"
                                        className="btn-edit"
                                        onClick={() => openEditModal(address)}
                                    >
                                        <Pencil className="action-icon" aria-hidden="true" />
                                        {t("editAddress")}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-delete"
                                        onClick={() => handleDeleteClick(address.id)}
                                    >
                                        <Trash2 className="action-icon" aria-hidden="true" />
                                        {t("delete")}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

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

export default function AddressesPage() {
    return (
        <Suspense>
            <AddressesContent />
        </Suspense>
    );
}
