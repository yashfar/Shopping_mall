import { auth } from "../../lib/auth-helper";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "30px" }}>Dashboard</h1>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>User Information</h2>
        <div style={{ marginBottom: "10px" }}>
          <strong>Email:</strong> {session.user.email}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>ID:</strong> {session.user.id}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Role:</strong> {session.user.role}
        </div>
      </div>

      <LogoutButton />
    </div>
  );
}
