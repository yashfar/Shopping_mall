import { NextResponse } from "next/server";
import { fetchTurkiyeApiCollection, isNumericId } from "../_turkiye-api";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get("districtId");
    if (!districtId) return NextResponse.json({ error: "districtId required" }, { status: 400 });
    if (!isNumericId(districtId)) return NextResponse.json({ error: "districtId invalid" }, { status: 400 });

    try {
        const neighborhoods = await fetchTurkiyeApiCollection(
            `/districts/${districtId}/neighborhoods?fields=id,name&sort=name&limit=500`,
            {
                dataset: "neighborhoods",
                filter: (neighborhood) =>
                    (neighborhood as { districtId?: number }).districtId === Number(districtId),
            }
        );
        const data = neighborhoods.map((neighborhood) => {
            const item = neighborhood as { id: number; name: string };
            return { id: item.id, name: item.name };
        }).sort((a, b) => a.name.localeCompare(b.name, "tr"));

        return NextResponse.json(data);
    } catch (error) {
        console.error(
            `Address neighborhoods lookup failed for district ${districtId}:`,
            error instanceof Error ? error.message : "Unknown upstream error"
        );
        return NextResponse.json(
            { error: "Neighborhood service is temporarily unavailable" },
            { status: 503, headers: { "Retry-After": "5" } }
        );
    }
}
