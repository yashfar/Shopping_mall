import type { CsvColumnDef, ProductCsvRow } from "./types";

/**
 * RFC 4180 compliant CSV field escaping.
 *
 * Rules applied:
 *   - If value contains a comma, double-quote, CR (\r), or LF (\n)
 *     → wrap the entire field in double-quotes.
 *   - Any double-quote inside the value is escaped by doubling it ("").
 *   - Turkish/non-ASCII characters are left untouched — they are safe in
 *     UTF-8 CSV and do NOT need quoting.
 */
export function escapeField(value: string): string {
  const needsQuoting =
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r");

  if (!needsQuoting) return value;
  return '"' + value.replace(/"/g, '""') + '"';
}

/**
 * Single source of truth for CSV column layout.
 *
 * Every column's header string and its serializer live together here.
 * `CSV_HEADER` (below) is derived by mapping `.header` over this array,
 * so the header row and the data rows are STRUCTURALLY IMPOSSIBLE to drift
 * out of sync — adding, removing, or reordering a column automatically
 * updates both.
 */
export const PRODUCT_CSV_COLUMNS: ReadonlyArray<CsvColumnDef<ProductCsvRow>> = [
  {
    header: "title",
    serialize: (r) => escapeField(r.title),
  },
  {
    header: "description",
    serialize: (r) => escapeField(r.description),
  },
  {
    header: "title_en",
    serialize: (r) => escapeField(r.title_en),
  },
  {
    header: "description_en",
    serialize: (r) => escapeField(r.description_en),
  },
  {
    header: "price",
    // Always two decimal places; period as separator (universally parseable)
    serialize: (r) => r.price.toFixed(2),
  },
  {
    header: "salePrice",
    serialize: (r) => (r.salePrice !== null ? r.salePrice.toFixed(2) : ""),
  },
  {
    header: "stock",
    serialize: (r) => String(r.stock),
  },
  {
    header: "category",
    serialize: (r) => escapeField(r.category),
  },
  {
    header: "isActive",
    serialize: (r) => String(r.isActive),
  },
  {
    header: "thumbnail",
    serialize: (r) => escapeField(r.thumbnail),
  },
] as const;

/**
 * The CSV header line, derived from PRODUCT_CSV_COLUMNS.
 * Never write this string by hand — it is always computed.
 */
export const CSV_HEADER: string = PRODUCT_CSV_COLUMNS.map((c) => c.header).join(",");

/**
 * Serialize one ProductCsvRow into a CSV line (no trailing newline).
 * Column order is determined entirely by PRODUCT_CSV_COLUMNS.
 */
export function serializeRow(row: ProductCsvRow): string {
  return PRODUCT_CSV_COLUMNS.map((col) => col.serialize(row)).join(",");
}
