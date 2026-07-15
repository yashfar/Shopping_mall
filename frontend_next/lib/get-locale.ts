/**
 * Reads the NEXT_LOCALE cookie from a Request and returns the validated locale.
 * Falls back to "en" if not present or invalid.
 */
export function getLocaleFromRequest(req: Request): "tr" | "en" {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    const raw = match?.[1];
    if (raw === "tr" || raw === "en") return raw;
    return "en";
}
