import { NextResponse } from "next/server";
import { fetchTurkiyeApiCollection, isNumericId } from "../_turkiye-api";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const provinceId = searchParams.get("provinceId");
    if (!provinceId) return NextResponse.json({ error: "provinceId required" }, { status: 400 });
    if (!isNumericId(provinceId)) return NextResponse.json({ error: "provinceId invalid" }, { status: 400 });

    try {
        const districts = await fetchTurkiyeApiCollection(
            `/provinces/${provinceId}/districts?fields=id,name&sort=name&limit=100`,
            {
                dataset: "districts",
                filter: (district) =>
                    (district as { provinceId?: number }).provinceId === Number(provinceId),
            }
        );
        const data = districts.map((district) => {
            const item = district as { id: number; name: string };
            return { id: item.id, name: item.name };
        }).sort((a, b) => a.name.localeCompare(b.name, "tr"));

        return NextResponse.json(data);
    } catch (error) {
        console.error(
            `Address districts lookup failed for province ${provinceId}:`,
            error instanceof Error ? error.message : "Unknown upstream error"
        );
        return NextResponse.json(
            { error: "District service is temporarily unavailable" },
            { status: 503, headers: { "Retry-After": "5" } }
        );
    }
}
