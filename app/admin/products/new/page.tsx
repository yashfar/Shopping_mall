"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import "./new-product.css";

interface UploadedImage {
    url: string;
    file: File;
}

export default function NewProductPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [stock, setStock] = useState("0");
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [thumbnail, setThumbnail] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories");
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/admin/upload/product-image", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to upload image");
                }

                const data = await response.json();
                return { url: data.url, file };
            });

            const uploadedImages = await Promise.all(uploadPromises);
            setImages((prev) => [...prev, ...uploadedImages]);

            // Auto-select first image as thumbnail if none selected
            if (!thumbnail && uploadedImages.length > 0) {
                setThumbnail(uploadedImages[0].url);
            }

            toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
        } catch (err: any) {
            toast.error(err.message || "Failed to upload images");
        } finally {
            setUploading(false);
            e.target.value = ""; // Reset input
        }
    };

    const handleRemoveImage = (urlToRemove: string) => {
        setImages((prev) => prev.filter((img) => img.url !== urlToRemove));
        if (thumbnail === urlToRemove) {
            const remaining = images.filter((img) => img.url !== urlToRemove);
            setThumbnail(remaining.length > 0 ? remaining[0].url : "");
        }
    };

    const handleSetThumbnail = (url: string) => {
        setThumbnail(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Frontend Validation
        if (images.length === 0) {
            toast.error("Please upload at least one product image");
            return;
        }

        if (!thumbnail) {
            toast.error("Please select a thumbnail image");
            return;
        }

        if (!title.trim() || !description.trim() || !category.trim()) {
            toast.error("Please fill in all required fields (Title, Description, Category)");
            return;
        }

        const priceInCents = Math.round(parseFloat(price) * 100);
        if (isNaN(priceInCents) || priceInCents <= 0) {
            toast.error("Please enter a valid positive price");
            return;
        }

        const stockNumber = parseInt(stock);
        if (isNaN(stockNumber) || stockNumber < 0) {
            toast.error("Please enter a valid stock quantity");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("/api/admin/product/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    price: priceInCents,
                    category: category.trim(),
                    stock: stockNumber,
                    images: images.map((img) => img.url),
                    thumbnail,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.details) {
                    // Handle validation details
                    const detailMessages = data.details.map((d: any) => `${d.field}: ${d.message}`).join(", ");
                    throw new Error(detailMessages || "Validation failed");
                }
                throw new Error(data.error || data.message || "Failed to create product");
            }

            toast.success("Product created successfully! Redirecting...");
            setTimeout(() => {
                router.push("/admin/products");
            }, 1500);
        } catch (err: any) {
            toast.error(err.message || "Failed to create product");
            setSubmitting(false);
        }
    };

    return (
        <div className="new-product-container">
            <div className="new-product-header">
                <button
                    onClick={() => router.back()}
                    className="btn-back"
                    disabled={submitting}
                >
                    ← Back
                </button>
                <h1>Add New Product</h1>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
                {/* Image Upload Section */}
                <div className="form-section">
                    <h2 className="section-title">Product Images</h2>
                    <p className="section-description">
                        Upload product images. The first image will be set as the thumbnail by default.
                    </p>

                    <div className="upload-area">
                        <input
                            type="file"
                            id="image-upload"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            multiple
                            onChange={handleFileSelect}
                            disabled={uploading || submitting}
                            className="file-input"
                        />
                        <label htmlFor="image-upload" className="upload-label">
                            {uploading ? (
                                <div className="spinner mb-2"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="upload-icon">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            )}
                            <span className="upload-text">
                                {uploading ? "Uploading images..." : "Click to upload images"}
                            </span>
                            <span className="upload-hint">
                                JPEG, PNG, or WebP (Max 5MB each)
                            </span>
                        </label>
                    </div>

                    {images.length > 0 && (
                        <div className="images-grid">
                            {images.map((image, index) => (
                                <div
                                    key={image.url}
                                    className={`image-card ${thumbnail === image.url ? "is-thumbnail" : ""}`}
                                >
                                    <div className="image-wrapper">
                                        <Image
                                            src={image.url}
                                            alt={`Product ${index + 1}`}
                                            width={200}
                                            height={200}
                                            className="product-image"
                                        />
                                        {thumbnail === image.url && (
                                            <div className="thumbnail-badge">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="check-icon">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                </svg>
                                                Thumbnail
                                            </div>
                                        )}
                                    </div>
                                    <div className="image-actions">
                                        <button
                                            type="button"
                                            onClick={() => handleSetThumbnail(image.url)}
                                            className="btn-thumbnail"
                                            disabled={thumbnail === image.url || submitting}
                                        >
                                            Set as Thumbnail
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(image.url)}
                                            className="btn-delete"
                                            disabled={submitting}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Details Section */}
                <div className="form-section">
                    <h2 className="section-title">Product Details</h2>

                    <div className="form-group">
                        <label htmlFor="title" className="form-label">
                            Product Title <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="form-input"
                            placeholder="Enter product title"
                            required
                            disabled={submitting}
                            maxLength={200}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description" className="form-label">
                            Description <span className="required">*</span>
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="form-textarea"
                            placeholder="Enter product description"
                            required
                            disabled={submitting}
                            rows={5}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="price" className="form-label">
                                Price (USD) <span className="required">*</span>
                            </label>
                            <div className="input-with-prefix">
                                <span className="input-prefix">$</span>
                                <input
                                    type="number"
                                    id="price"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="form-input with-prefix"
                                    placeholder="0.00"
                                    required
                                    disabled={submitting}
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="stock" className="form-label">
                                Stock Quantity <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="stock"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="form-input"
                                placeholder="0"
                                required
                                disabled={submitting}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="category" className="form-label">
                            Category <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="category"
                            list="category-suggestions"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-input"
                            placeholder="Select or type a category..."
                            required
                            disabled={submitting}
                            autoComplete="off"
                        />
                        <datalist id="category-suggestions">
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.name} />
                            ))}
                        </datalist>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn-cancel"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={submitting || uploading}
                    >
                        {submitting ? (
                            <>
                                <div className="spinner"></div>
                                Creating Product...
                            </>
                        ) : (
                            "Create Product"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
