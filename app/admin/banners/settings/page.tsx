"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    ArrowLeft,
    Timer,
    Play,
    Repeat,
    MousePointer2,
    Save,
    Loader2,
    Zap,
    MoveRight,
    Search,
    Eye,
    EyeOff,
    Check,
    MonitorPlay
} from "lucide-react";

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Loader2 className="w-10 h-10 text-[#C8102E] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/30 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex flex-col gap-6 mb-10">
                    <button
                        onClick={() => router.back()}
                        className="self-start flex items-center gap-2 text-gray-500 hover:text-[#1A1A1A] transition-colors font-medium text-sm group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Banners
                    </button>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight mb-2">
                            Global Configuration
                        </h1>
                        <p className="text-gray-500 text-lg max-w-2xl">
                            Customize the behavior and appearance of the main banner carousel across your entire storefront.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* LEFT COLUMN: Settings Form */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Section: Timing */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">

                                    <h2 className="text-xl font-bold text-[#1A1A1A]">Timing & Speed</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label htmlFor="animationSpeed" className="text-sm font-bold text-gray-700">
                                            Transition Speed
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                id="animationSpeed"
                                                value={animationSpeed}
                                                onChange={(e) => setAnimationSpeed(e.target.value)}
                                                className="w-full pl-4 pr-12 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-[#C8102E] focus:ring-4 focus:ring-[#C8102E]/10 rounded-xl transition-all font-bold text-lg outline-none"
                                                placeholder="500"
                                                disabled={submitting}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">ms</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium">Speed of the slide transition</p>
                                    </div>

                                    <div className="space-y-3">
                                        <label htmlFor="slideDelay" className="text-sm font-bold text-gray-700">
                                            Auto-Play Delay
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                id="slideDelay"
                                                value={slideDelay}
                                                onChange={(e) => setSlideDelay(e.target.value)}
                                                className="w-full pl-4 pr-12 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-[#C8102E] focus:ring-4 focus:ring-[#C8102E]/10 rounded-xl transition-all font-bold text-lg outline-none"
                                                placeholder="3000"
                                                disabled={submitting}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">ms</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium">Duration before next slide</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Visuals */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">

                                    <h2 className="text-xl font-bold text-[#1A1A1A]">Transition Style</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { value: "slide", label: "Slide", icon: MoveRight, desc: "Classic horizontal movement" },
                                        { value: "fade", label: "Fade", icon: Eye, desc: "Smooth opacity crossfade" },
                                        { value: "zoom", label: "Zoom", icon: Search, desc: "Scale in/out effect" },
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setAnimationType(type.value)}
                                            disabled={submitting}
                                            className={`relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-300 ${animationType === type.value
                                                ? "border-[#C8102E] bg-[#C8102E]/5 ring-1 ring-[#C8102E]"
                                                : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-md"
                                                }`}
                                        >
                                            {animationType === type.value && (
                                                <div className="absolute top-3 right-3 text-[#C8102E]">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            )}
                                            <div className={`p-3 rounded-full mb-3 ${animationType === type.value ? 'bg-[#C8102E] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                <type.icon className="w-6 h-6" />
                                            </div>
                                            <div className="font-bold text-[#1A1A1A] mb-1">{type.label}</div>
                                            <div className="text-[10px] text-gray-400 font-medium leading-tight">{type.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Controls */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <h2 className="text-xl font-bold text-[#1A1A1A]">Interaction & Controls</h2>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-4">
                                            Navigation Arrows
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {[
                                                { value: "show", label: "Always Visible", icon: Eye },
                                                { value: "hover", label: "On Hover", icon: MousePointer2 },
                                                { value: "invisible", label: "Hidden", icon: EyeOff },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setArrowDisplay(option.value)}
                                                    disabled={submitting}
                                                    className={`group relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${arrowDisplay === option.value
                                                        ? "border-[#C8102E] bg-[#FAFAFA] text-[#C8102E]"
                                                        : "border-gray-100 bg-white text-gray-600 hover:border-gray-300"
                                                        }`}
                                                >
                                                    <option.icon className={`w-5 h-5 ${arrowDisplay === option.value ? 'text-[#C8102E]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                                    <span className="font-bold text-sm">{option.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${loop ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                                                <Repeat className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#1A1A1A]">Infinite Loop</div>
                                                <div className="text-xs text-gray-500">Carousel restarts after last slide</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setLoop(!loop)}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-2 ${loop ? "bg-[#C8102E]" : "bg-gray-300"
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${loop ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Summary & Actions */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8 space-y-4">
                                {/* Summary Card */}
                                <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-xl overflow-hidden relative">
                                    {/* Decorative background gradients */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8102E]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                                    <div className="relative z-10">
                                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                            <MonitorPlay className="w-5 h-5 text-gray-400" />
                                            Live Configuration
                                        </h3>

                                        <div className="space-y-4 text-sm">
                                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                                <span className="text-gray-400">Mode</span>
                                                <span className="font-bold capitalize text-[#C8102E]">{animationType}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                                <span className="text-gray-400">Duration</span>
                                                <span className="font-bold">{animationSpeed}ms</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                                <span className="text-gray-400">Delay</span>
                                                <span className="font-bold">{slideDelay}ms</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                                <span className="text-gray-400">Looping</span>
                                                <span className={`font-bold ${loop ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                    {loop ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                                <span className="text-gray-400">Arrows</span>
                                                <span className="font-bold capitalize">{arrowDisplay === 'invisible' ? 'Hidden' : arrowDisplay}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-[#C8102E] hover:bg-[#A00D24] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#C8102E]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                        {submitting ? 'Saving Changes...' : 'Save Configuration'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        disabled={submitting}
                                        className="w-full py-4 bg-white border-2 border-gray-100 text-gray-500 hover:text-[#1A1A1A] hover:border-gray-200 rounded-2xl font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <p className="text-xs text-center text-gray-400 max-w-[250px] mx-auto mt-4 px-4 leading-relaxed">
                                    Changes will be published immediately to the live storefront.
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
