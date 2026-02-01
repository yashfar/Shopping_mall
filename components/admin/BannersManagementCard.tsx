"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Loader2,
    Plus,
    Trash2,
    GripVertical,
    Pencil,
    ImageIcon,
    CheckCircle2,
    XCircle,
    Sparkles
} from "lucide-react";
import DeleteBannerButton from "@/admin/banners/DeleteBannerButton";

interface Banner {
    id: string;
    imageUrl: string;
    title: string | null;
    subtitle: string | null;
    order: number;
    active: boolean;
}

function SortableBannerItem({
    banner,
    onDelete,
}: {
    banner: Banner;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: banner.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" : "static",
    } as const;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-br from-white to-gray-50/50 border-2 rounded-2xl mb-4 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] ${isDragging
                ? "shadow-2xl ring-4 ring-[#C8102E]/30 opacity-90 scale-[1.02] border-[#C8102E] z-50"
                : "border-gray-100 hover:border-[#C8102E]/30 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:shadow-[#C8102E]/5 hover:-translate-y-1"
                }`}
        >
            {/* Mobile Header: Drag Handle & Actions (visible on mobile top) */}
            <div className="flex sm:hidden w-full items-center justify-between mb-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-2 text-gray-300 hover:text-[#C8102E] transition-all bg-gray-50 rounded-lg"
                >
                    <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/admin/banners/${banner.id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-500 bg-gray-50 rounded-lg"
                    >
                        <Pencil className="w-4 h-4" />
                    </Link>
                    <DeleteBannerButton bannerId={banner.id} onSuccess={() => onDelete(banner.id)} />
                </div>
            </div>

            {/* Drag Handle (Desktop) */}
            <div
                {...attributes}
                {...listeners}
                className="hidden sm:block cursor-grab active:cursor-grabbing p-2 text-gray-300 hover:text-[#C8102E] transition-all duration-200 hover:scale-110 group-hover:text-gray-400 group-hover:bg-gray-50 rounded-lg"
            >
                <GripVertical className="w-6 h-6" />
            </div>

            {/* Banner Preview */}
            <div className="relative w-full sm:w-32 h-32 sm:h-20 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-100 flex-shrink-0 shadow-sm group-hover:shadow-xl group-hover:border-[#C8102E]/20 transition-all duration-500 ease-out sm:group-hover:scale-105">
                <Image
                    src={banner.imageUrl}
                    alt={banner.title || "Banner"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Banner Info */}
            <div className="flex-1 min-w-0 w-full">
                <h4 className="font-bold text-[#1A1A1A] text-base truncate mb-1.5 group-hover:text-[#C8102E] transition-colors duration-300">
                    {banner.title || "Untitled Banner"}
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                    {banner.active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-gradient-to-r from-emerald-100 to-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                        </span>
                    )}
                    {banner.subtitle && (
                        <span className="text-xs text-gray-400 truncate max-w-[200px] group-hover:text-gray-500 transition-colors">
                            {banner.subtitle}
                        </span>
                    )}
                </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                <Link
                    href={`/admin/banners/${banner.id}/edit`}
                    className="p-2.5 text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-110 active:scale-95 group-hover:bg-gray-50 group-hover:text-blue-500"
                >
                    <Pencil className="w-5 h-5" />
                </Link>
                <DeleteBannerButton bannerId={banner.id} onSuccess={() => onDelete(banner.id)} />
            </div>

        </div>
    );
}

export default function BannersManagementCard() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchBanners = async () => {
        try {
            const res = await fetch("/api/admin/banners");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            if (Array.isArray(data)) {
                setBanners(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load banners");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setBanners((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Save new order
                saveOrder(newItems);

                return newItems;
            });
        }
    };

    const saveOrder = async (orderedItems: Banner[]) => {
        try {
            const payload = {
                items: orderedItems.map((item, index) => ({
                    id: item.id,
                    order: index,
                })),
            };

            const res = await fetch("/api/admin/banners", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save order");

        } catch (error) {
            console.error(error);
            toast.error("Failed to save banner order");
        }
    };

    const activeBanners = banners.filter(b => b.active).length;

    return (
        <div className="bg-gradient-to-br from-white via-gray-50/30 to-white rounded-3xl border-2 border-gray-100 shadow-lg overflow-hidden flex flex-col h-full hover:shadow-2xl transition-shadow duration-300">
            {/* Header with Gradient */}
            <div className="relative p-8 border-b-2 border-gray-100 bg-gradient-to-br from-gray-50 via-white to-gray-50/50 overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#C8102E]/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl" />

                <div className="relative flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="hidden md:block p-2 bg-gradient-to-br from-[#C8102E] to-pink-600 rounded-xl shadow-lg">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
                                Main Banners
                            </h3>
                        </div>
                        <p className="text-gray-500 text-sm font-medium md:ml-12">
                            Manage your hero section carousel banners
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 items-center">
                        <span className="bg-gradient-to-r from-[#1A1A1A] to-gray-800 text-white text-sm font-bold px-4 py-2 rounded-full whitespace-nowrap shadow-lg">
                            {banners.length} Total
                        </span>
                        {activeBanners > 0 && (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {activeBanners} Active
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 bg-gradient-to-b from-gray-50/30 to-white overflow-y-auto max-h-[600px] custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 animate-spin text-[#C8102E]" />
                            <div className="absolute inset-0 w-12 h-12 animate-ping text-[#C8102E]/20">
                                <Loader2 className="w-12 h-12" />
                            </div>
                        </div>
                        <p className="mt-4 text-gray-400 font-medium">Loading banners...</p>
                    </div>
                ) : banners.length === 0 ? (
                    <div className="relative text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gradient-to-br from-gray-50 to-white overflow-hidden group hover:border-[#C8102E]/30 transition-all duration-300">
                        {/* Decorative background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#C8102E]/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative">
                            <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                                <ImageIcon className="w-16 h-16 text-gray-300 group-hover:text-[#C8102E]/50 transition-colors duration-300" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-600 mb-2">No Banners Yet</h4>
                            <p className="text-gray-400 font-medium mb-6 max-w-md mx-auto">
                                Create your first banner to showcase featured content on your homepage
                            </p>
                            <Link
                                href="/admin/banners/new"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C8102E] to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Create Your First Banner
                            </Link>
                        </div>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={banners.map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {banners.map((item) => (
                                <SortableBannerItem
                                    key={item.id}
                                    banner={item}
                                    onDelete={fetchBanners}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Footer with Add Button */}
            <div className="p-5 border-t-2 border-gray-100 bg-gradient-to-br from-white to-gray-50/50">
                <Link
                    href="/admin/banners/new"
                    className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#1A1A1A] to-gray-800 text-white font-bold rounded-xl hover:from-[#C8102E] hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-2xl active:scale-95 hover:scale-[1.02]"
                >
                    <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                        <Plus className="w-5 h-5" />
                    </div>
                    Add New Banner
                </Link>
            </div>
        </div>
    );
}
