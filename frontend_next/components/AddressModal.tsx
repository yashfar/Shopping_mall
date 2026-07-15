"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@@/components/ui/select";
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

interface GeoItem {
    id: number;
    name: string;
}

const emptyForm = {
    title: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    district: "",
    neighborhood: "",
    fullAddress: "",
};

export default function AddressModal({
    isOpen,
    onClose,
    mode,
    existingAddress,
    onSuccess,
}: AddressModalProps) {
    const t = useTranslations("address");
    const [formData, setFormData] = useState({ ...emptyForm });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [provinces, setProvinces] = useState<GeoItem[]>([]);
    const [districts, setDistricts] = useState<GeoItem[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<GeoItem[]>([]);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

    // Select value'ları artık isimler — formData.city/district/neighborhood'dan direkt okunur.
    // ID'ler sadece API çağrıları için ref'te tutulur.
    const provinceIdRef = useRef("");
    const districtIdRef = useRef("");
    const cascadeLoadedRef = useRef<string | null>(null); // hangi adres için yüklendi

    // Load provinces once on mount
    useEffect(() => {
        fetch("/api/address/provinces")
            .then((r) => r.json())
            .then((data) => setProvinces(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    // Modal açılınca form sıfırla
    useEffect(() => {
        if (!isOpen) return;
        setError("");
        setDistricts([]);
        setNeighborhoods([]);
        provinceIdRef.current = "";
        districtIdRef.current = "";
        cascadeLoadedRef.current = null;

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
            setFormData({ ...emptyForm });
        }
    }, [isOpen, mode, existingAddress]);

    // Edit modunda seçenek listelerini yükle (formData'yı değiştirmez, sadece options)
    useEffect(() => {
        if (!isOpen || mode !== "edit" || !existingAddress || provinces.length === 0) return;
        if (cascadeLoadedRef.current === existingAddress.id) return;
        cascadeLoadedRef.current = existingAddress.id;

        const norm = (s: string) => s.toLocaleLowerCase("tr");
        const province = provinces.find((p) => norm(p.name) === norm(existingAddress.city));
        if (!province) return;

        provinceIdRef.current = province.id.toString();
        setLoadingDistricts(true);

        fetch(`/api/address/districts?provinceId=${province.id}`)
            .then((r) => r.json())
            .then((raw) => {
                const data: GeoItem[] = Array.isArray(raw) ? raw : [];
                setDistricts(data);

                const district = data.find((d) => norm(d.name) === norm(existingAddress.district));
                if (!district) return;

                districtIdRef.current = district.id.toString();
                setLoadingNeighborhoods(true);

                fetch(`/api/address/neighborhoods?districtId=${district.id}`)
                    .then((r2) => r2.json())
                    .then((raw2) => setNeighborhoods(Array.isArray(raw2) ? raw2 : []))
                    .finally(() => setLoadingNeighborhoods(false));
            })
            .finally(() => setLoadingDistricts(false));
    }, [isOpen, provinces, mode, existingAddress]);

    const handleProvinceChange = async (name: string) => {
        const province = provinces.find((p) => p.name === name);
        if (!province) return;
        provinceIdRef.current = province.id.toString();
        districtIdRef.current = "";
        setDistricts([]);
        setNeighborhoods([]);
        setFormData((prev) => ({ ...prev, city: name, district: "", neighborhood: "" }));

        setLoadingDistricts(true);
        try {
            const res = await fetch(`/api/address/districts?provinceId=${province.id}`);
            const data = await res.json();
            setDistricts(Array.isArray(data) ? data : []);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const handleDistrictChange = async (name: string) => {
        const district = districts.find((d) => d.name === name);
        if (!district) return;
        districtIdRef.current = district.id.toString();
        setNeighborhoods([]);
        setFormData((prev) => ({ ...prev, district: name, neighborhood: "" }));

        setLoadingNeighborhoods(true);
        try {
            const res = await fetch(`/api/address/neighborhoods?districtId=${district.id}`);
            const data = await res.json();
            setNeighborhoods(Array.isArray(data) ? data : []);
        } finally {
            setLoadingNeighborhoods(false);
        }
    };

    const handleNeighborhoodChange = (name: string) => {
        setFormData((prev) => ({ ...prev, neighborhood: name }));
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const url =
                mode === "add" ? "/api/address/add" : `/api/address/${existingAddress?.id}`;
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
                setError(data.error || t("failedToSave"));
            }
        } catch {
            setError(t("genericError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="address-modal-overlay" onClick={handleOverlayClick}>
            <div className="address-modal-content">
                <div className="address-modal-header">
                    <h2>{mode === "add" ? t("addNewAddress") : t("editAddress")}</h2>
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
                            {t("title")} <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder={t("titlePlaceholder")}
                            required
                            className="address-form-input"
                        />
                    </div>

                    <div className="address-form-row">
                        <div className="address-form-group">
                            <label htmlFor="firstName">
                                {t("firstName")} <span className="required">*</span>
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
                                {t("lastName")} <span className="required">*</span>
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
                            {t("phone")} <span className="required">*</span>
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder={t("phonePlaceholder")}
                            required
                            className="address-form-input"
                        />
                    </div>

                    {/* Cascade: Şehir → İlçe */}
                    <div className="address-form-row">
                        <div className="address-form-group">
                            <label>
                                {t("city")} <span className="required">*</span>
                            </label>
                            <Select
                                value={formData.city}
                                onValueChange={handleProvinceChange}
                                required
                            >
                                <SelectTrigger className="address-form-input">
                                    <SelectValue placeholder={t("selectCity")} />
                                </SelectTrigger>
                                <SelectContent className="z-1100">
                                    {provinces.map((p) => (
                                        <SelectItem key={p.id} value={p.name}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="address-form-group">
                            <label>
                                {t("district")} <span className="required">*</span>
                            </label>
                            <Select
                                key={districts.length > 0 ? `d-${formData.city}` : "d-empty"}
                                value={formData.district}
                                onValueChange={handleDistrictChange}
                                disabled={!formData.city || loadingDistricts}
                                required
                            >
                                <SelectTrigger className="address-form-input">
                                    <SelectValue
                                        placeholder={
                                            loadingDistricts
                                                ? t("loadingDistricts")
                                                : t("selectDistrict")
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent className="z-1100">
                                    {districts
                                        .filter((d, i, arr) => arr.findIndex((x) => x.name === d.name) === i)
                                        .map((d) => (
                                            <SelectItem key={d.id} value={d.name}>
                                                {d.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Mahalle */}
                    <div className="address-form-group">
                        <label>
                            {t("neighborhood")} <span className="required">*</span>
                        </label>
                        <Select
                            key={neighborhoods.length > 0 ? `nh-${formData.district}` : "nh-empty"}
                            value={formData.neighborhood}
                            onValueChange={handleNeighborhoodChange}
                            disabled={!formData.district || loadingNeighborhoods}
                            required
                        >
                            <SelectTrigger className="address-form-input">
                                <SelectValue
                                    placeholder={
                                        loadingNeighborhoods
                                            ? t("loadingNeighborhoods")
                                            : t("selectNeighborhood")
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent className="z-1100">
                                {neighborhoods
                                    .filter((n, i, arr) => arr.findIndex((x) => x.name === n.name) === i)
                                    .map((n) => (
                                        <SelectItem key={n.id} value={n.name}>
                                            {n.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="address-form-group">
                        <label htmlFor="fullAddress">
                            {t("fullAddress")} <span className="required">*</span>
                        </label>
                        <textarea
                            id="fullAddress"
                            name="fullAddress"
                            value={formData.fullAddress}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder={t("addressPlaceholder")}
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
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            className="address-btn-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="address-btn-spinner"></div>
                                    {t("saving")}
                                </>
                            ) : mode === "add" ? (
                                t("addAddress")
                            ) : (
                                t("saveChanges")
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
