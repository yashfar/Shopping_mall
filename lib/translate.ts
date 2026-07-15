const DEEPL_FREE_URL = "https://api-free.deepl.com/v2/translate";
const DEEPL_PAID_URL = "https://api.deepl.com/v2/translate";

async function deepl(texts: string[]): Promise<string[] | null> {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
        console.warn("[translate] DEEPL_API_KEY not set, skipping auto-translation");
        return null;
    }

    const url = apiKey.endsWith(":fx") ? DEEPL_FREE_URL : DEEPL_PAID_URL;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `DeepL-Auth-Key ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: texts, source_lang: "TR", target_lang: "EN" }),
        });

        if (!res.ok) {
            console.error("[translate] DeepL error:", res.status, await res.text());
            return null;
        }

        const data = await res.json();
        return data.translations.map((t: { text: string }) => t.text);
    } catch (err) {
        console.error("[translate] DeepL request failed:", err);
        return null;
    }
}

// Translate a single text (e.g. category name)
export async function translateText(text: string): Promise<string> {
    const results = await deepl([text]);
    return results?.[0] ?? text;
}

// Translate product title + description together in one API call
export async function translateToEnglish(
    title: string,
    description: string
): Promise<{ titleEn: string; descriptionEn: string }> {
    const results = await deepl([title, description]);
    return {
        titleEn: results?.[0] ?? title,
        descriptionEn: results?.[1] ?? description,
    };
}
