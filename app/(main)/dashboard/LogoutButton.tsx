"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="px-6 py-3 bg-[#C8102E] text-white font-bold rounded-xl transition-all hover:bg-[#A90D27] hover:shadow-[0_4px_12px_rgba(200,16,46,0.3)] active:scale-95"
    >
      Sign Out
    </button>
  );
}

