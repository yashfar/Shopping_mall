"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function MainPageFrame({
  navbar,
  children,
}: {
  navbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <div
      data-auth={isAuthPage ? "true" : "false"}
      className={`group/auth ${isAuthPage ? "relative isolate bg-[#ead9c4]" : ""}`}
    >
      {isAuthPage ? (
        <Image
          src="/images/auth/mediterranean-courtyard.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[64%_center] sm:object-[60%_center] lg:object-center"
        />
      ) : null}
      {navbar}
      <main>{children}</main>
    </div>
  );
}
