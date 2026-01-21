import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import ProfileContent from "./ProfileContent";

export default async function ProfilePage() {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/profile");
    }

    return (
        <div style={{ maxWidth: "900px", margin: "50px auto", padding: "20px" }}>
            <h1 style={{ marginBottom: "30px", fontSize: "2rem", fontWeight: "700" }}>
                My Profile
            </h1>
            <ProfileContent />
        </div>
    );
}
