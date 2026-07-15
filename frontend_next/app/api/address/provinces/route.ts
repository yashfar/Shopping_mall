import { NextResponse } from "next/server";

export async function GET() {
    const res = await fetch("https://turkiyeapi.dev/api/v1/provinces?limit=100&fields=id,name", {
        next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch provinces" }, { status: 502 });
    const json = await res.json();
    const data = json.data.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name }));
    return NextResponse.json(data);
}
