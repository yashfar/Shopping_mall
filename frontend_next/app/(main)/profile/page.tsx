import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import ProfileContent from "./ProfileContent";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/profile");
    }

    const t = await getTranslations("profile");

    return (
        <div className="max-w-225 mx-auto mt-6 mb-10 px-4 sm:px-6 md:mt-12 md:px-5">
            <h1 className="mb-6 text-2xl font-bold md:text-[2rem] md:mb-8">
                {t("myProfile")}
            </h1>
            <ProfileContent />
        </div>
    );
}
