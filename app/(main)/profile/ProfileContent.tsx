"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AvatarUpload from "./AvatarUpload";
import "./profile-content.css";

interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    image: string | null;
    phone: string | null;
    birthdate: string | null;
    role: string;
}

export default function ProfileContent() {
    const [user, setUser] = useState<User | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/profile");
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setFirstName(data.user.firstName || "");
                setLastName(data.user.lastName || "");
                setPhone(data.user.phone || "");
                setBirthdate(data.user.birthdate ? data.user.birthdate.split('T')[0] : "");
            } else {
                setMessage({ type: "error", text: "Failed to load profile" });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            setMessage({ type: "error", text: "Failed to load profile" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    birthdate: birthdate || null,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setMessage({ type: "success", text: "Profile updated successfully!" });
                router.refresh();
            } else {
                setMessage({
                    type: "error",
                    text: data.error || "Failed to update profile",
                });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: "error", text: "Failed to update profile" });
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = () => {
        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return "U";
    };

    if (isLoading) {
        return (
            <div className="profile-loading">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-error">
                <p>Failed to load profile. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="profile-content">
            <div className="profile-header">
                <div className="avatar-section">
                    {(user.avatar || user.image) && !imageError ? (
                        <img
                            src={user.avatar || user.image || ""}
                            alt="Avatar"
                            className="profile-avatar-image"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="profile-avatar-placeholder">
                            <span className="profile-avatar-initials">{getInitials()}</span>
                        </div>
                    )}
                </div>
                <div className="user-info">
                    <h2 className="profile-user-name">
                        {firstName && lastName
                            ? `${firstName} ${lastName}`
                            : user.email.split("@")[0]}
                    </h2>
                    <p className="profile-user-email">{user.email}</p>
                    <span className="profile-user-role-badge">{user.role}</span>
                </div>
            </div>

            {/* Avatar Upload Component */}
            <AvatarUpload
                currentAvatar={user.avatar || user.image || null}
                userId={user.id}
                onSuccess={fetchProfile}
            />

            {message && (
                <div className={`message message-${message.type}`}>
                    {message.type === "success" ? "✓" : "✕"} {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-section">
                    <h3 className="section-title">Personal Information</h3>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={user.email}
                            disabled
                            className="form-input input-disabled"
                        />
                        <p className="form-hint">Email cannot be changed</p>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName" className="form-label">
                                First Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                maxLength={50}
                                className="form-input"
                                placeholder="Enter your first name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName" className="form-label">
                                Last Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                maxLength={50}
                                className="form-input"
                                placeholder="Enter your last name"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phone" className="form-label">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                maxLength={20}
                                className="form-input"
                                placeholder="e.g., +90 555 123 4567"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="birthdate" className="form-label">
                                Birthdate
                            </label>
                            <input
                                type="date"
                                id="birthdate"
                                value={birthdate}
                                onChange={(e) => setBirthdate(e.target.value)}
                                className="form-input"
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn-secondary"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <span className="btn-spinner"></span>
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
