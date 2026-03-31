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
        <div style={{ maxWidth: "900px", margin: "50px auto", padding: "20px" }}>
            <h1 style={{ marginBottom: "30px", fontSize: "2rem", fontWeight: "700" }}>
                {t("myProfile")}
            </h1>
            <ProfileContent />
        </div>
    );
}
