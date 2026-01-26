"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BannerSettings {
    id: string;
    animationSpeed: number;
    slideDelay: number;
    animationType: string;
    loop: boolean;
    arrowDisplay: string;
    createdAt: Date;
}

export default function BannerSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [animationSpeed, setAnimationSpeed] = useState("500");
    const [slideDelay, setSlideDelay] = useState("3000");
    const [animationType, setAnimationType] = useState("slide");
    const [loop, setLoop] = useState(true);
    const [arrowDisplay, setArrowDisplay] = useState("hover");

    // Fetch current settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/admin/banners/settings");

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to fetch settings");
                }

                const data: BannerSettings = await response.json();
                setAnimationSpeed(data.animationSpeed.toString());
                setSlideDelay(data.slideDelay.toString());
                setAnimationType(data.animationType);
                setLoop(data.loop);
                setArrowDisplay(data.arrowDisplay || "hover");
            } catch (err: any) {
                toast.error(err.message || "Failed to load settings");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const speed = parseInt(animationSpeed);
        if (isNaN(speed) || speed < 100 || speed > 5000) {
            toast.error("Animation speed must be between 100 and 5000 milliseconds");
            return;
        }

        const delay = parseInt(slideDelay);
        if (isNaN(delay) || delay < 1000 || delay > 10000) {
            toast.error("Slide delay must be between 1000 and 10000 milliseconds");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("/api/admin/banners/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    animationSpeed: speed,
                    slideDelay: delay,
                    animationType,
                    loop,
                    arrowDisplay,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update settings");
            }

            toast.success("Settings updated successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to update settings");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-[#C8102E] border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 text-[#1A1A1A] hover:text-[#C8102E] transition-colors font-bold"
                    disabled={submitting}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                        />
                    </svg>
                    Back
                </button>
                <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">
                    Carousel Settings
                </h1>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-white"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                        />
                    </svg>
                </div>
                <div>
                    <p className="text-[#1A1A1A] font-bold mb-1">
                        Configure Banner Carousel Behavior
                    </p>
                    <p className="text-sm text-[#4A4A4A] font-medium leading-relaxed">
                        These settings control how banners transition and display on the homepage.
                        Changes take effect immediately for all visitors.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Settings Card */}
                <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
                        Animation Settings
                    </h2>

                    {/* Animation Speed */}
                    <div>
                        <label
                            htmlFor="animationSpeed"
                            className="block text-sm font-bold text-[#1A1A1A] mb-2"
                        >
                            Animation Speed (milliseconds)
                        </label>
                        <input
                            type="number"
                            id="animationSpeed"
                            value={animationSpeed}
                            onChange={(e) => setAnimationSpeed(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder="500"
                            disabled={submitting}
                            min="100"
                            max="5000"
                            step="50"
                        />
                        <p className="text-xs text-[#A9A9A9] mt-1">
                            How fast banners transition (100-5000ms). Lower = faster.
                        </p>
                    </div>

                    {/* Slide Delay */}
                    <div>
                        <label
                            htmlFor="slideDelay"
                            className="block text-sm font-bold text-[#1A1A1A] mb-2"
                        >
                            Slide Delay (milliseconds)
                        </label>
                        <input
                            type="number"
                            id="slideDelay"
                            value={slideDelay}
                            onChange={(e) => setSlideDelay(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder="3000"
                            disabled={submitting}
                            min="1000"
                            max="10000"
                            step="500"
                        />
                        <p className="text-xs text-[#A9A9A9] mt-1">
                            How long each banner displays (1000-10000ms). Recommended: 3000-5000ms.
                        </p>
                    </div>

                    {/* Animation Type */}
                    <div>
                        <label
                            htmlFor="animationType"
                            className="block text-sm font-bold text-[#1A1A1A] mb-2"
                        >
                            Animation Type
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { value: "slide", label: "Slide", icon: "→" },
                                { value: "fade", label: "Fade", icon: "◐" },
                                { value: "zoom", label: "Zoom", icon: "⊕" },
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setAnimationType(type.value)}
                                    disabled={submitting}
                                    className={`px-6 py-4 border-2 rounded-xl font-bold transition-all duration-200 ${animationType === type.value
                                        ? "border-[#C8102E] bg-[#C8102E] text-white"
                                        : "border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#C8102E]"
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{type.icon}</div>
                                    {type.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-[#A9A9A9] mt-2">
                            Choose how banners transition between slides.
                        </p>
                    </div>

                    {/* Arrow Display */}
                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            Arrow Display
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { value: "show", label: "Always Show", icon: "👁" },
                                { value: "hover", label: "Show on Hover", icon: "🖱" },
                                { value: "invisible", label: "Hidden", icon: "🚫" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setArrowDisplay(option.value)}
                                    disabled={submitting}
                                    className={`px-6 py-4 border-2 rounded-xl font-bold transition-all duration-200 ${arrowDisplay === option.value
                                            ? "border-[#C8102E] bg-[#C8102E] text-white"
                                            : "border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#C8102E]"
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{option.icon}</div>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-[#A9A9A9] mt-2">
                            Control when navigation arrows are visible.
                        </p>
                    </div>

                    {/* Loop Toggle */}
                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            Continuous Loop
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setLoop(!loop)}
                                disabled={submitting}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${loop ? "bg-[#C8102E]" : "bg-[#A9A9A9]"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${loop ? "translate-x-7" : "translate-x-1"
                                        }`}
                                />
                            </button>
                            <span className="text-sm font-bold text-[#1A1A1A]">
                                {loop ? "Enabled" : "Disabled"}
                            </span>
                        </div>
                        <p className="text-xs text-[#A9A9A9] mt-2">
                            {loop
                                ? "Carousel will loop continuously from last to first banner"
                                : "Carousel will stop at the last banner"}
                        </p>
                    </div>
                </div>

                {/* Preview Info */}
                <div className="bg-[#FAFAFA] border-2 border-[#E5E5E5] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">
                        Current Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-[#A9A9A9] font-medium">Animation Speed:</span>
                            <span className="ml-2 text-[#1A1A1A] font-bold">
                                {animationSpeed}ms
                            </span>
                        </div>
                        <div>
                            <span className="text-[#A9A9A9] font-medium">Slide Delay:</span>
                            <span className="ml-2 text-[#1A1A1A] font-bold">
                                {slideDelay}ms
                            </span>
                        </div>
                        <div>
                            <span className="text-[#A9A9A9] font-medium">Animation:</span>
                            <span className="ml-2 text-[#1A1A1A] font-bold capitalize">
                                {animationType}
                            </span>
                        </div>
                        <div>
                            <span className="text-[#A9A9A9] font-medium">Loop:</span>
                            <span className="ml-2 text-[#1A1A1A] font-bold">
                                {loop ? "Yes" : "No"}
                            </span>
                        </div>
                        <div>
                            <span className="text-[#A9A9A9] font-medium">Arrows:</span>
                            <span className="ml-2 text-[#1A1A1A] font-bold capitalize">
                                {arrowDisplay === "show" ? "Always" : arrowDisplay === "hover" ? "On Hover" : "Hidden"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-3 bg-white border-2 border-[#A9A9A9] text-[#1A1A1A] font-bold rounded-xl hover:bg-[#FAFAFA] transition-all duration-200"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A00D24] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving Settings...
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.5 12.75l6 6 9-13.5"
                                    />
                                </svg>
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
