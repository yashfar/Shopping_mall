import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const provinceId = searchParams.get("provinceId");
    if (!provinceId) return NextResponse.json({ error: "provinceId required" }, { status: 400 });

    const res = await fetch(
        `https://turkiyeapi.dev/api/v1/districts?provinceId=${provinceId}&limit=100&fields=id,name`,
        { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch districts" }, { status: 502 });
    const json = await res.json();
    const data = json.data.map((d: { id: number; name: string }) => ({ id: d.id, name: d.name }));
    return NextResponse.json(data);
}
