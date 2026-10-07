import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import CartContent from "./CartContent";
import { getTranslations } from "next-intl/server";

export default async function CartPage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/cart");
    }

    const t = await getTranslations("cart");

    return (
        <div className="mx-auto my-6 max-w-6xl px-4 md:my-12 md:px-6">
            <h1 className="mb-5 text-[28px] font-black tracking-tight text-[#1A1A1A] md:mb-8 md:text-3xl">{t("title")}</h1>
            <CartContent />
        </div>
    );
}
