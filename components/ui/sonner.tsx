"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            theme="light"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#1A1A1A] group-[.toaster]:border-[#A9A9A9] group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:font-bold",
                    description: "group-[.toast]:text-[#A9A9A9]",
                    actionButton:
                        "group-[.toast]:bg-[#C8102E] group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:rounded-lg",
                    cancelButton:
                        "group-[.toast]:bg-[#FAFAFA] group-[.toast]:text-[#A9A9A9] group-[.toast]:border-[#A9A9A9]",
                    success: "group-[.toaster]:bg-white group-[.toaster]:text-emerald-600 group-[.toaster]:border-emerald-200",
                    error: "group-[.toaster]:bg-white group-[.toaster]:text-[#C8102E] group-[.toaster]:border-[#C8102E]/20",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
