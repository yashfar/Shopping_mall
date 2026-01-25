"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const banners = [
    {
        id: 1,
        image: "/banner/banner-1.jpg",
        title: "Elegance in Every Frame",
        subtitle: "Crafted with timeless precision."
    },
    {
        id: 2,
        image: "/banner/banner-2.jpg",
        title: "Engineered for the Modern Ear",
        subtitle: "Your Vision, Our Filament."
    },
    {
        id: 3,
        image: "/banner/banner-3.jpg",
        title: "Unleash Your Speed",
        subtitle: "Precision Crafted. Engineered."
    }
];

export default function BannerCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, []);

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] aspect-video overflow-hidden mb-12 shadow-2xl group border-y border-[#A9A9A9]/20 h-[calc(100vh-75px)]">
            {/* Slides */}
            <div
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {banners.map((banner) => (
                    <div key={banner.id} className="relative min-w-full h-full">
                        <Image
                            src={banner.image}
                            alt={banner.title}
                            fill
                            className="object-cover"
                            priority={banner.id === 1}
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent flex flex-col justify-center px-12 md:px-24">
                            {/* <h2 className="text-white text-5xl md:text-7xl font-black mb-4 animate-slide-up-fade">
                                {banner.title}
                            </h2>
                            <p className="text-white/90 text-xl md:text-2xl font-medium max-w-lg mb-8 animate-slide-up-fade delay-100">
                                {banner.subtitle}
                            </p>
                            <button className="w-fit px-8 py-4 bg-[#C8102E] text-white rounded-xl font-bold text-lg hover:bg-[#A90D27] transition-all transform hover:scale-105 active:scale-95 shadow-xl">
                                Shop Collection
                            </button> */}
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>

            {/* Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`transition-all duration-300 rounded-full ${currentIndex === index
                            ? "w-8 h-2 bg-white"
                            : "w-2 h-2 bg-white/40 hover:bg-white/60"
                            }`}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes slide-up-fade {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slide-up-fade {
                    animation: slide-up-fade 0.8s ease-out forwards;
                }
                .delay-100 {
                    animation-delay: 0.1s;
                }
            `}</style>
        </div>
    );
}
