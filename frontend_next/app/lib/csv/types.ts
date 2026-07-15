/**
 * The canonical shape of one product row in the exported CSV.
 * All prices are in decimal form (e.g. 420.00), NOT stored-as-cents.
 */
export interface ProductCsvRow {
  title: string;
  description: string;
  title_en: string;
  description_en: string;
  price: number;
  salePrice: number | null;
  stock: number;
  category: string;
  isActive: boolean;
  thumbnail: string;
}

/**
 * Ties a CSV column header to its serializer so they can never drift apart.
 * The header row is always derived from these definitions, not written by hand.
 */
export interface CsvColumnDef<T> {
  readonly header: string;
  readonly serialize: (row: T) => string;
}
