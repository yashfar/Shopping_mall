import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get("districtId");
    if (!districtId) return NextResponse.json({ error: "districtId required" }, { status: 400 });

    const res = await fetch(
        `https://turkiyeapi.dev/api/v1/neighborhoods?districtId=${districtId}&limit=500&fields=id,name`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch neighborhoods" }, { status: 502 });
    const json = await res.json();
    const data = json.data.map((n: { id: number; name: string }) => ({ id: n.id, name: n.name }));
    return NextResponse.json(data);
}
