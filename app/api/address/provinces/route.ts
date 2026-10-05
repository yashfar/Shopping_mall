import { NextResponse } from "next/server";
import { fetchTurkiyeApiCollection } from "../_turkiye-api";

export async function GET() {
    try {
        const provinces = await fetchTurkiyeApiCollection(
            "/provinces?fields=id,name&sort=name&limit=100",
            { dataset: "provinces" }
        );
        const data = provinces.map((province) => {
            const item = province as { id: number; name: string };
            return { id: item.id, name: item.name };
        }).sort((a, b) => a.name.localeCompare(b.name, "tr"));

        return NextResponse.json(data);
    } catch (error) {
        console.error(
            "Address provinces lookup failed:",
            error instanceof Error ? error.message : "Unknown upstream error"
        );
        return NextResponse.json(
            { error: "Province service is temporarily unavailable" },
            { status: 503, headers: { "Retry-After": "5" } }
        );
    }
}
