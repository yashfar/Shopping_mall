const TR_MAP: Record<string, string> = {
    "ı": "i", "ğ": "g", "ş": "s", "ö": "o", "ü": "u", "ç": "c",
    "İ": "i", "Ğ": "g", "Ş": "s", "Ö": "o", "Ü": "u", "Ç": "c",
};

export function toSlug(name: string): string {
    return name
        .replace(/[ığşöüçİĞŞÖÜÇ]/g, (c) => TR_MAP[c] ?? c)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}
