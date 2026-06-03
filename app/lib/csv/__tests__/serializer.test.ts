/**
 * Unit tests for the CSV serializer layer.
 *
 * Run with:
 *   node --import tsx/esm --test app/lib/csv/__tests__/serializer.test.ts
 * or via the package.json script:
 *   pnpm test:csv
 *
 * No test framework is required — uses Node.js 18+ built-in test runner.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  escapeField,
  serializeRow,
  CSV_HEADER,
  PRODUCT_CSV_COLUMNS,
} from "../serializer";
import type { ProductCsvRow } from "../types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<ProductCsvRow> = {}): ProductCsvRow {
  return {
    title: "Test Product",
    description: "A simple description",
    title_en: "Test Product",
    description_en: "A simple description",
    price: 420.0,
    salePrice: null,
    stock: 5,
    category: "Sculpture",
    isActive: true,
    thumbnail: "https://example.com/img.webp",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// escapeField
// ---------------------------------------------------------------------------

describe("escapeField", () => {
  it("returns plain ASCII unchanged", () => {
    assert.equal(escapeField("hello world"), "hello world");
  });

  it("returns Turkish characters unchanged — no quoting needed", () => {
    assert.equal(
      escapeField("Günü Çift Heykeli İskandinav"),
      "Günü Çift Heykeli İskandinav"
    );
  });

  it("wraps field containing a comma in double-quotes", () => {
    assert.equal(escapeField("Garaj, ofis"), '"Garaj, ofis"');
  });

  it("wraps field containing a double-quote and escapes it by doubling", () => {
    assert.equal(escapeField('say "hello"'), '"say ""hello"""');
  });

  it("wraps field containing LF (\\n)", () => {
    assert.equal(escapeField("line1\nline2"), '"line1\nline2"');
  });

  it("wraps field containing CR (\\r)", () => {
    assert.equal(escapeField("line1\rline2"), '"line1\rline2"');
  });

  it("handles empty string without quoting", () => {
    assert.equal(escapeField(""), "");
  });

  it("handles a field that is only double-quotes", () => {
    // Input: ""  (2 double-quote chars)
    // Each " doubles to "" → """"
    // Wrapped in outer quotes → """"""  (6 chars total)
    // Parser reads: open-" | "" | "" | close-" → value = ""  ✓
    assert.equal(escapeField('""'), '""""""');
  });

  it("handles field with both comma and double-quote", () => {
    assert.equal(escapeField('a,"b"'), '"a,""b"""');
  });

  it("handles a very long Turkish description without quoting", () => {
    const long =
      "Japon sadeliği ile İskandinav işlevselliğini bir araya getiren Japandi tasarım anlayışından ilham alınmıştır";
    assert.equal(escapeField(long), long);
  });
});

// ---------------------------------------------------------------------------
// CSV_HEADER structural invariants
// ---------------------------------------------------------------------------

describe("CSV_HEADER", () => {
  it("contains exactly 10 comma-separated columns", () => {
    assert.equal(CSV_HEADER.split(",").length, 10);
  });

  it("matches the headers declared in PRODUCT_CSV_COLUMNS", () => {
    const expected = PRODUCT_CSV_COLUMNS.map((c) => c.header).join(",");
    assert.equal(CSV_HEADER, expected);
  });

  it("has the correct column names in the correct order", () => {
    assert.equal(
      CSV_HEADER,
      "title,description,title_en,description_en,price,salePrice,stock,category,isActive,thumbnail"
    );
  });

  it("PRODUCT_CSV_COLUMNS has no duplicate headers", () => {
    const headers = PRODUCT_CSV_COLUMNS.map((c) => c.header);
    const unique = new Set(headers);
    assert.equal(unique.size, headers.length);
  });
});

// ---------------------------------------------------------------------------
// serializeRow — happy path
// ---------------------------------------------------------------------------

describe("serializeRow — happy path", () => {
  it("serializes a fully-populated row without column shifting", () => {
    const row = makeRow({ price: 420.0, salePrice: 400.0, stock: 2 });
    const result = serializeRow(row);
    const cols = result.split(",");
    assert.equal(cols.length, 10);
    assert.equal(cols[4], "420.00"); // price
    assert.equal(cols[5], "400.00"); // salePrice
    assert.equal(cols[6], "2");      // stock
  });

  it("produces exactly 10 comma-separated fields for a minimal row", () => {
    const result = serializeRow(makeRow());
    // Split on commas NOT inside quotes to count top-level fields
    const fields = splitCsvLine(result);
    assert.equal(fields.length, 10);
  });

  it("price uses period decimal separator, not comma", () => {
    const result = serializeRow(makeRow({ price: 1234.56 }));
    assert.match(result, /1234\.56/);
    assert.doesNotMatch(result, /1234,56/);
  });

  it("isActive serializes to 'true' / 'false'", () => {
    assert.match(serializeRow(makeRow({ isActive: true })),  /true/);
    assert.match(serializeRow(makeRow({ isActive: false })), /false/);
  });
});

// ---------------------------------------------------------------------------
// serializeRow — null / missing values
// ---------------------------------------------------------------------------

describe("serializeRow — null and empty values", () => {
  it("null salePrice becomes an empty field, not 'null'", () => {
    const result = serializeRow(makeRow({ salePrice: null }));
    const fields = splitCsvLine(result);
    assert.equal(fields[5], ""); // salePrice column index = 5
  });

  it("empty description renders as empty field", () => {
    const result = serializeRow(makeRow({ description: "" }));
    const fields = splitCsvLine(result);
    assert.equal(fields[1], "");
  });

  it("empty title_en renders as empty field", () => {
    const result = serializeRow(makeRow({ title_en: "", description_en: "" }));
    const fields = splitCsvLine(result);
    assert.equal(fields[2], "");
    assert.equal(fields[3], "");
  });

  it("zero stock renders as '0'", () => {
    const result = serializeRow(makeRow({ stock: 0 }));
    const fields = splitCsvLine(result);
    assert.equal(fields[6], "0");
  });
});

// ---------------------------------------------------------------------------
// serializeRow — special characters in text fields
// ---------------------------------------------------------------------------

describe("serializeRow — commas inside text fields", () => {
  it("quotes a title containing a comma and column count stays 10", () => {
    const result = serializeRow(makeRow({ title: "Garaj, ofis dekorasyonu" }));
    const fields = splitCsvLine(result);
    assert.equal(fields.length, 10);
    assert.equal(fields[0], "Garaj, ofis dekorasyonu");
  });

  it("quotes a description with multiple commas", () => {
    const desc = "iPad, tablet, telefon ve kalem için tasarlanmış stand";
    const result = serializeRow(makeRow({ description: desc }));
    const fields = splitCsvLine(result);
    assert.equal(fields[1], desc);
    assert.equal(fields.length, 10);
  });
});

describe("serializeRow — double-quotes inside text fields", () => {
  it("escapes double-quotes and column count stays 10", () => {
    const result = serializeRow(makeRow({ title: 'The "Original" Piece' }));
    const fields = splitCsvLine(result);
    assert.equal(fields.length, 10);
    assert.equal(fields[0], 'The "Original" Piece');
  });
});

describe("serializeRow — multiline text fields", () => {
  it("quotes a description with embedded newline, column count stays 10", () => {
    const result = serializeRow(
      makeRow({ description: "Line one.\nLine two." })
    );
    const fields = splitCsvLine(result);
    assert.equal(fields.length, 10);
    assert.equal(fields[1], "Line one.\nLine two.");
  });
});

// ---------------------------------------------------------------------------
// serializeRow — Turkish characters
// ---------------------------------------------------------------------------

describe("serializeRow — Turkish characters", () => {
  it("round-trips Turkish title without modification", () => {
    const title = "Sevgililer Günü Çift Heykeli";
    const result = serializeRow(makeRow({ title }));
    const fields = splitCsvLine(result);
    assert.equal(fields[0], title);
  });

  it("round-trips Turkish description without quoting (no special chars)", () => {
    const desc =
      "İki figürün öpüşme anını soyut ve narin çizgilerle aktaran heykel";
    const result = serializeRow(makeRow({ description: desc }));
    const fields = splitCsvLine(result);
    assert.equal(fields[1], desc);
    // Should NOT be quoted because it has no comma, quote, or newline
    assert.doesNotMatch(result.split(",")[1], /^"/);
  });

  it("Turkish description with comma is quoted but value is preserved", () => {
    const desc = "Garaj, ofis veya kişisel alan dekorasyonu için ideal";
    const result = serializeRow(makeRow({ description: desc }));
    const fields = splitCsvLine(result);
    assert.equal(fields[1], desc);
    assert.equal(fields.length, 10);
  });
});

// ---------------------------------------------------------------------------
// serializeRow — numeric edge cases
// ---------------------------------------------------------------------------

describe("serializeRow — numeric edge cases", () => {
  it("price 0 renders as '0.00'", () => {
    const result = serializeRow(makeRow({ price: 0 }));
    const fields = splitCsvLine(result);
    assert.equal(fields[4], "0.00");
  });

  it("large price renders correctly", () => {
    const result = serializeRow(makeRow({ price: 9999.99 }));
    const fields = splitCsvLine(result);
    assert.equal(fields[4], "9999.99");
  });

  it("salePrice 0 renders as '0.00' (falsy but valid)", () => {
    const result = serializeRow(makeRow({ salePrice: 0 }));
    const fields = splitCsvLine(result);
    assert.equal(fields[5], "0.00");
  });
});

// ---------------------------------------------------------------------------
// Large dataset simulation
// ---------------------------------------------------------------------------

describe("large dataset simulation", () => {
  it("serializes 5000 rows without throwing", () => {
    const rows = Array.from({ length: 5000 }, (_, i) =>
      makeRow({
        title: `Product ${i}`,
        price: 100 + i * 0.01,
        stock: i,
      })
    );
    assert.doesNotThrow(() => {
      for (const row of rows) serializeRow(row);
    });
  });

  it("all 5000 rows produce exactly 10 fields", () => {
    const rows = Array.from({ length: 5000 }, (_, i) =>
      makeRow({ title: `Product ${i}, with comma` })
    );
    for (const row of rows) {
      const fields = splitCsvLine(serializeRow(row));
      assert.equal(fields.length, 10);
    }
  });
});

// ---------------------------------------------------------------------------
// Helper: minimal RFC 4180 CSV line parser (for test assertions only)
// ---------------------------------------------------------------------------

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}
