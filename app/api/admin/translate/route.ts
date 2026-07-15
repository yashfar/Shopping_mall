import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";

const DEEPL_FREE_URL = "https://api-free.deepl.com/v2/translate";
const DEEPL_PAID_URL = "https://api.deepl.com/v2/translate";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Translation service not configured" }, { status: 503 });
    }

    try {
        const { texts, from, to } = await req.json();

        if (!Array.isArray(texts) || texts.length === 0) {
            return NextResponse.json({ error: "texts array is required" }, { status: 400 });
        }

        const url = apiKey.endsWith(":fx") ? DEEPL_FREE_URL : DEEPL_PAID_URL;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `DeepL-Auth-Key ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: texts,
                source_lang: from ?? "EN",
                target_lang: to ?? "TR",
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("[translate API] DeepL error:", res.status, err);
            return NextResponse.json({ error: "Translation failed" }, { status: 502 });
        }

        const data = await res.json();
        return NextResponse.json({
            translations: data.translations.map((t: { text: string }) => t.text),
        });
    } catch (err) {
        console.error("[translate API] error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
