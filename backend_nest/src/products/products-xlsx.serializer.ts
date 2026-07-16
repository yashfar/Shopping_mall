import { Injectable } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';

export type ProductXlsxItem = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  isActive: boolean;
  categoryId: string | null;
  thumbnail: string | null;
  shippingDays: string;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; nameEn: string | null } | null;
  images: { id: string; productId: string; url: string; createdAt: Date }[];
  variants: {
    id: string;
    productId: string;
    color: string;
    colorHex: string | null;
    stock: number;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
  }[];
  reviews: {
    id: string;
    productId: string;
    userId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
  }[];
};

@Injectable()
export class ProductsXlsxSerializer {
  async serialize(products: ProductXlsxItem[]): Promise<Buffer> {
    const workbook = new Workbook();
    workbook.creator = 'Shopping Mall NestJS';
    workbook.created = new Date();

    this.addProductsSheet(workbook, products);
    this.addCategoriesSheet(workbook, products);
    this.addImagesSheet(workbook, products);
    this.addVariantsSheet(workbook, products);
    this.addReviewsSheet(workbook, products);

    const output = await workbook.xlsx.writeBuffer();
    return Buffer.from(output);
  }

  private addProductsSheet(workbook: Workbook, products: ProductXlsxItem[]) {
    const sheet = workbook.addWorksheet('Products');
    sheet.columns = [
      { header: 'id', key: 'id', width: 28 },
      { header: 'title', key: 'title', width: 35 },
      { header: 'description', key: 'description', width: 55 },
      { header: 'priceCent', key: 'price', width: 14 },
      { header: 'salePriceCent', key: 'salePrice', width: 16 },
      { header: 'stock', key: 'stock', width: 10 },
      { header: 'isActive', key: 'isActive', width: 11 },
      { header: 'categoryId', key: 'categoryId', width: 28 },
      { header: 'thumbnail', key: 'thumbnail', width: 45 },
      { header: 'shippingDays', key: 'shippingDays', width: 14 },
      { header: 'createdAt', key: 'createdAt', width: 22 },
      { header: 'updatedAt', key: 'updatedAt', width: 22 },
    ];
    sheet.addRows(
      products.map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice,
        stock: product.stock,
        isActive: product.isActive,
        categoryId: product.categoryId,
        thumbnail: product.thumbnail,
        shippingDays: product.shippingDays,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })),
    );
    this.formatSheet(sheet, ['createdAt', 'updatedAt']);
  }

  private addCategoriesSheet(workbook: Workbook, products: ProductXlsxItem[]) {
    const sheet = workbook.addWorksheet('Categories');
    sheet.columns = [
      { header: 'id', key: 'id', width: 28 },
      { header: 'name', key: 'name', width: 30 },
      { header: 'nameEn', key: 'nameEn', width: 30 },
    ];

    const categories = new Map(
      products
        .filter((product) => product.category)
        .map((product) => [product.category!.id, product.category!]),
    );
    sheet.addRows([...categories.values()]);
    this.formatSheet(sheet);
  }

  private addImagesSheet(workbook: Workbook, products: ProductXlsxItem[]) {
    const sheet = workbook.addWorksheet('ProductImages');
    sheet.columns = [
      { header: 'id', key: 'id', width: 28 },
      { header: 'productId', key: 'productId', width: 28 },
      { header: 'url', key: 'url', width: 55 },
      { header: 'createdAt', key: 'createdAt', width: 22 },
    ];
    sheet.addRows(products.flatMap((product) => product.images));
    this.formatSheet(sheet, ['createdAt']);
  }

  private addVariantsSheet(workbook: Workbook, products: ProductXlsxItem[]) {
    const sheet = workbook.addWorksheet('ProductVariants');
    sheet.columns = [
      { header: 'id', key: 'id', width: 28 },
      { header: 'productId', key: 'productId', width: 28 },
      { header: 'color', key: 'color', width: 18 },
      { header: 'colorHex', key: 'colorHex', width: 13 },
      { header: 'stock', key: 'stock', width: 10 },
      { header: 'imagesJson', key: 'imagesJson', width: 55 },
      { header: 'createdAt', key: 'createdAt', width: 22 },
      { header: 'updatedAt', key: 'updatedAt', width: 22 },
    ];
    sheet.addRows(
      products.flatMap((product) =>
        product.variants.map(({ images, ...variant }) => ({
          ...variant,
          imagesJson: JSON.stringify(images),
        })),
      ),
    );
    this.formatSheet(sheet, ['createdAt', 'updatedAt']);
  }

  private addReviewsSheet(workbook: Workbook, products: ProductXlsxItem[]) {
    const sheet = workbook.addWorksheet('Reviews');
    sheet.columns = [
      { header: 'id', key: 'id', width: 28 },
      { header: 'productId', key: 'productId', width: 28 },
      { header: 'userId', key: 'userId', width: 28 },
      { header: 'rating', key: 'rating', width: 10 },
      { header: 'comment', key: 'comment', width: 55 },
      { header: 'createdAt', key: 'createdAt', width: 22 },
    ];
    sheet.addRows(products.flatMap((product) => product.reviews));
    this.formatSheet(sheet, ['createdAt']);
  }

  private formatSheet(sheet: Worksheet, dateColumns: string[] = []) {
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(sheet.rowCount, 1), column: sheet.columnCount },
    };
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A1A' },
      };
      cell.alignment = { vertical: 'middle' };
    });
    sheet.getRow(1).height = 22;
    dateColumns.forEach((key) => {
      sheet.getColumn(key).numFmt = 'yyyy-mm-dd hh:mm:ss';
    });
  }
}
