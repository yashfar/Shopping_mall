"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Banner {
    id: string;
    imageUrl: string;
    title: string | null;
    subtitle: string | null;
    order: number;
    displayMode: string;
    alignment: string;
}

interface BannerSettings {
    id: string;
    animationSpeed: number;
    slideDelay: number;
    animationType: string;
    loop: boolean;
    arrowDisplay: string;
    createdAt: Date;
}

interface BannerCarouselProps {
    banners: Banner[];
    settings: BannerSettings;
}

export default function BannerCarousel({ banners, settings }: BannerCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const nextSlide = useCallback(() => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setCurrentIndex((prevIndex) => {
            if (settings.loop) {
                return (prevIndex + 1) % banners.length;
            } else {
                return prevIndex < banners.length - 1 ? prevIndex + 1 : prevIndex;
            }
        });

        setTimeout(() => setIsTransitioning(false), settings.animationSpeed);
    }, [banners.length, settings.loop, settings.animationSpeed, isTransitioning]);

    const prevSlide = () => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setCurrentIndex((prevIndex) => {
            if (settings.loop) {
                return (prevIndex - 1 + banners.length) % banners.length;
            } else {
                return prevIndex > 0 ? prevIndex - 1 : prevIndex;
            }
        });

        setTimeout(() => setIsTransitioning(false), settings.animationSpeed);
    };

    const goToSlide = (index: number) => {
        if (isTransitioning || index === currentIndex) return;

        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), settings.animationSpeed);
    };

    // Auto-advance slides
    useEffect(() => {
        if (banners.length <= 1) return;

        const timer = setInterval(() => {
            nextSlide();
        }, settings.slideDelay);

        return () => clearInterval(timer);
    }, [nextSlide, settings.slideDelay, banners.length]);

    // Don't render if no banners
    if (banners.length === 0) {
        return null;
    }

    // Animation class based on type
    const getAnimationClass = () => {
        switch (settings.animationType) {
            case "fade":
                return "opacity-0";
            case "zoom":
                return "scale-95 opacity-0";
            case "slide":
            default:
                return "";
        }
    };

    const getActiveAnimationClass = () => {
        switch (settings.animationType) {
            case "fade":
                return "opacity-100";
            case "zoom":
                return "scale-100 opacity-100";
            case "slide":
            default:
                return "";
        }
    };

    return (
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-auto md:aspect-video overflow-hidden mb-8 md:mb-12 shadow-2xl group border-y border-[#A9A9A9]/20 max-h-[calc(100vh-75px)]">
            {/* Slides */}
            {settings.animationType === "slide" ? (
                // Slide animation (horizontal scroll)
                <div
                    className="flex h-full transition-transform ease-in-out"
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`,
                        transitionDuration: `${settings.animationSpeed}ms`,
                    }}
                >
                    {banners.map((banner) => (
                        <div key={banner.id} className="relative min-w-full h-full">
                            <Image
                                src={banner.imageUrl}
                                alt={banner.title || "Banner"}
                                fill
                                className="object-cover"
                                style={{
                                    objectFit: banner.displayMode as any,
                                    objectPosition: banner.alignment,
                                }}
                                priority={banner.order === 0}
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                        </div>
                    ))}
                </div>
            ) : (
                // Fade/Zoom animation (stacked)
                <div className="relative h-full">
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id}
                            className={`absolute inset-0 transition-all ease-in-out ${index === currentIndex
                                ? getActiveAnimationClass()
                                : getAnimationClass()
                                }`}
                            style={{
                                transitionDuration: `${settings.animationSpeed}ms`,
                                zIndex: index === currentIndex ? 10 : 0,
                            }}
                        >
                            <Image
                                src={banner.imageUrl}
                                alt={banner.title || "Banner"}
                                fill
                                className="object-cover"
                                style={{
                                    objectFit: banner.displayMode as any,
                                    objectPosition: banner.alignment,
                                }}
                                priority={banner.order === 0}
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                        </div>
                    ))}
                </div>
            )}

            {/* Navigation Buttons - Only show if more than 1 banner and not invisible */}
            {banners.length > 1 && (settings.arrowDisplay || "hover") !== "invisible" && (
                <>
                    <button
                        onClick={prevSlide}
                        disabled={!settings.loop && currentIndex === 0}
                        className={`cursor-pointer absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-white/20 disabled:opacity-0 disabled:cursor-not-allowed ${(settings.arrowDisplay || "hover") === "show"
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                            }`}
                        aria-label="Previous banner"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-5 h-5 md:w-6 md:h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5L8.25 12l7.5-7.5"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        disabled={!settings.loop && currentIndex === banners.length - 1}
                        className={`cursor-pointer absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-white/20 disabled:opacity-0 disabled:cursor-not-allowed ${(settings.arrowDisplay || "hover") === "show"
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                            }`}
                        aria-label="Next banner"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-5 h-5 md:w-6 md:h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 4.5l7.5 7.5-7.5 7.5"
                            />
                        </svg>
                    </button>
                </>
            )}

            {/* Indicators - Only show if more than 1 banner */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                    {banners.map((banner, index) => (
                        <button
                            key={banner.id}
                            onClick={() => goToSlide(index)}
                            className={`transition-all duration-300 rounded-full ${currentIndex === index
                                ? "w-6 h-2 md:w-8 md:h-2.5 bg-white"
                                : "w-2 h-2 md:w-2.5 md:h-2.5 bg-white/40 hover:bg-white/60"
                                }`}
                            aria-label={`Go to banner ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
