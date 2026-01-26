"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DeleteBannerButtonProps {
    bannerId: string;
}

export default function DeleteBannerButton({ bannerId }: DeleteBannerButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/banners/${bannerId}/delete`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete banner");
            }

            toast.success("Banner deleted successfully");
            router.refresh();
            setShowConfirm(false);
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete banner");
        } finally {
            setIsDeleting(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="flex-1 flex gap-2">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-2.5 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A00D24] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                    {isDeleting ? "..." : "Yes"}
                </button>
                <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-2.5 bg-[#A9A9A9] text-white font-bold rounded-xl hover:bg-[#8A8A8A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                    No
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-[#C8102E] text-[#C8102E] font-bold rounded-xl hover:bg-[#C8102E] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
            </svg>
        </button>
    );
}
