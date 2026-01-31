"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import ProductSelectModal from "./ProductSelectModal";

interface CarouselItem {
    id: string;
    order: number;
    productId: string;
    product: {
        id: string;
        title: string;
        price: number;
        thumbnail: string | null;
        isActive: boolean;
        stock: number;
    };
}

interface CarouselManagementCardProps {
    title: string;
    description: string;
    type: "best-seller" | "new-products";
}

function SortableItem({
    item,
    onDelete,
}: {
    item: CarouselItem;
    onDelete: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: item.id });

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
            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-gray-100 rounded-xl mb-3 transition-all ${isDragging ? "shadow-xl ring-2 ring-[#C8102E] opacity-90 scale-105" : "hover:shadow-md hover:border-[#C8102E]/20"
                }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                {item.product.thumbnail ? (
                    <Image
                        src={item.product.thumbnail}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 uppercase font-bold">
                        No Img
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#1A1A1A] text-sm truncate">
                    {item.product.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs">
                    <span className="text-gray-500 font-medium">
                        ${(item.product.price / 100).toFixed(2)}
                    </span>
                    <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.product.stock > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {item.product.stock > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                </div>
            </div>

            <button
                onClick={() => onDelete(item.id)}
                className="p-2 text-gray-400 hover:text-[#C8102E] hover:bg-[#C8102E]/10 rounded-lg transition-colors flex-shrink-0"
                title="Remove from carousel"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function CarouselManagementCard({
    title,
    description,
    type,
}: CarouselManagementCardProps) {
    const [items, setItems] = useState<CarouselItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchCarousel = async () => {
        try {
            const res = await fetch(`/api/carousels/${type}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            if (data && data.items) {
                setItems(data.items);
            }
        } catch (error) {
            console.error(error);
            toast.error(`Failed to load ${title}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarousel();
    }, [type]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Save new order
                saveOrder(newItems);

                return newItems;
            });
        }
    };

    const saveOrder = async (orderedItems: CarouselItem[]) => {
        try {
            const payload = {
                items: orderedItems.map((item, index) => ({
                    id: item.id,
                    order: index,
                })),
            };

            // Optimistic update done in handleDragEnd, no loading state needed usually
            // but we can show saving indicator if wanted.

            const res = await fetch(`/api/carousels/${type}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save order");

        } catch (error) {
            console.error(error);
            toast.error("Failed to save new order");
            // Revert? For now keeping simple.
        }
    };

    const handleDelete = async (itemId: string) => {
        if (!confirm("Are you sure you want to remove this product from the carousel?")) return;

        setItems(items.filter((i) => i.id !== itemId)); // Optimistic

        try {
            const res = await fetch(`/api/carousels/${type}?itemId=${itemId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to remove item");
            toast.success("Item removed");
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove item");
            fetchCarousel(); // Revert on failure
        }
    };

    const handleAddProducts = async (productIds: string[]) => {
        setIsSaving(true);
        let addedCount = 0;
        let errors = 0;

        try {
            // Process sequentially to maintain order of selection or just Promise.all
            // Validation happens on server too.
            const results = await Promise.all(
                productIds.map((productId) =>
                    fetch(`/api/carousels/${type}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productId }),
                    })
                )
            );

            // Check results
            for (const res of results) {
                if (res.ok) addedCount++;
                else errors++;
            }

            if (addedCount > 0) {
                toast.success(`Added ${addedCount} products`);
                fetchCarousel();
            }
            if (errors > 0) {
                toast.warning(`${errors} products failed to add (maybe duplicates or limit reached)`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to add products");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-[#A9A9A9]/20 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-[#A9A9A9]/10 bg-gray-50/50">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-[#1A1A1A]">{title}</h3>
                        <p className="text-[#A9A9A9] text-sm mt-1">{description}</p>
                    </div>
                    <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        {items.length} / 12
                    </span>
                </div>
            </div>

            <div className="flex-1 p-6 bg-gray-50/30 overflow-y-auto max-h-[500px]">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-[#C8102E]" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-400 font-medium mb-4">No items yet</p>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-2 text-[#C8102E] font-bold hover:underline"
                        >
                            <Plus className="w-4 h-4" />
                            Add Products
                        </button>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {items.map((item) => (
                                <SortableItem
                                    key={item.id}
                                    item={item}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            <div className="p-4 border-t border-[#A9A9A9]/10 bg-white">
                <button
                    onClick={() => setModalOpen(true)}
                    disabled={items.length >= 12 || isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Plus className="w-5 h-5" />
                            Add Products
                        </>
                    )}
                </button>
            </div>

            <ProductSelectModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSelect={handleAddProducts}
                currentCount={items.length}
                existingProductIds={items.map((i) => i.productId)}
            />
        </div>
    );
}
