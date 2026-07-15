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
        <div className="max-w-6xl mx-auto px-4 md:px-6 my-8 md:my-12">
            <h1 className="text-3xl font-black text-[#1A1A1A] mb-6 md:mb-8">{t("title")}</h1>
            <CartContent />
        </div>
    );
}
