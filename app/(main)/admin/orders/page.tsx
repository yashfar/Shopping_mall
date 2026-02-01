import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import AdminOrdersList from "./AdminOrdersList";

type SearchParams = {
    status?: string;
};

type PageProps = {
    searchParams: SearchParams;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div style={{ maxWidth: "1400px", margin: "50px auto", padding: "20px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "30px",
                }}
            >
                <h1 style={{ margin: 0 }}>Order Management</h1>
                <a
                    href="/admin"
                    style={{
                        color: "#0070f3",
                        textDecoration: "none",
                        fontSize: "14px",
                    }}
                >
                    ← Back to Admin Panel
                </a>
            </div>

            <AdminOrdersList initialStatus={searchParams.status} />
        </div>
    );
}
