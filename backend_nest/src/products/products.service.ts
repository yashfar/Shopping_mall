import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ExportProductsQueryDto } from './dto/export-products-query.dto';
import { ProductsXlsxSerializer } from './products-xlsx.serializer';
import { Prisma } from '../../generated/prisma/client';
import { normalizeSearchText } from './normalize-search-text';

type ProductFilters = Pick<
  ExportProductsQueryDto,
  'search' | 'categoryId' | 'color' | 'minPrice' | 'maxPrice' | 'rating'
>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xlsxSerializer: ProductsXlsxSerializer,
  ) {}

  private async buildWhere(
    query: ProductFilters,
  ): Promise<Prisma.ProductWhereInput> {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.search?.trim()) {
      where.searchText = { contains: normalizeSearchText(query.search) };
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.color) {
      where.variants = {
        some: { color: { equals: query.color, mode: 'insensitive' } },
      };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) {
        where.price.gte = Math.round(query.minPrice * 100);
      }
      if (query.maxPrice !== undefined) {
        where.price.lte = Math.round(query.maxPrice * 100);
      }
    }

    if (query.rating !== undefined) {
      const ratedProducts = await this.prisma.review.groupBy({
        by: ['productId'],
        having: {
          rating: {
            _avg: { gte: query.rating },
          },
        },
      });

      where.id = {
        in: ratedProducts.map(({ productId }) => productId),
      };
    }

    return where;
  }

  private buildOrderBy(
    sort?: ExportProductsQueryDto['sort'],
  ): Prisma.ProductOrderByWithRelationInput {
    return sort === 'price_asc'
      ? { price: 'asc' }
      : sort === 'price_desc'
        ? { price: 'desc' }
        : { createdAt: 'desc' };
  }

  async findAll(query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const where = await this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.sort);

    const skip = (page - 1) * pageSize;
    const [products, totalProducts] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, nameEn: true } },
          variants: {
            select: { id: true, color: true, colorHex: true, stock: true },
          },
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    const items = products.map(({ reviews, ...product }) => {
      const reviewCount = reviews.length;
      const avgRating = reviewCount
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;
      return { ...product, avgRating, reviewCount };
    });

    const totalPages = Math.ceil(totalProducts / pageSize);
    const hasMore = page < totalPages;

    return {
      products: items,
      page,
      pageSize,
      totalProducts,
      totalPages,
      hasMore,
    };
  }

  async exportXlsx(query: ExportProductsQueryDto) {
    const where = await this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.sort);

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, nameEn: true } },
        images: {
          select: { id: true, productId: true, url: true, createdAt: true },
        },
        variants: {
          select: {
            id: true,
            productId: true,
            color: true,
            colorHex: true,
            stock: true,
            images: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        reviews: {
          select: {
            id: true,
            productId: true,
            userId: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
      orderBy,
    });

    return this.xlsxSerializer.serialize(products);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, nameEn: true } },
        images: { select: { id: true, url: true } },
        variants: {
          select: { id: true, color: true, colorHex: true, stock: true },
        },
        reviews: {
          select: { id: true, rating: true, comment: true, createdAt: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  async getFilters() {
    const [categories, variants, priceRange] = await Promise.all([
      this.prisma.category.findMany({
        where: {
          products: {
            some: {
              isActive: true,
            },
          },
        },
        select: { id: true, name: true, nameEn: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.productVariant.findMany({
        where: { product: { isActive: true } },
        distinct: ['color'],
        select: { color: true, colorHex: true },
        orderBy: { color: 'asc' },
      }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return {
      categories,
      colors: variants,
      priceRange: {
        min: priceRange._min.price ?? 0,
        max: priceRange._max.price ?? 0,
      },
    };
  }

  async create(dto: CreateProductDto) {
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true, name: true, nameEn: true },
      });

      if (!category) {
        throw new BadRequestException(
          `Category ${dto.categoryId} does not exist`,
        );
      }

      return this.prisma.product.create({
        data: {
          ...dto,
          searchText: normalizeSearchText(
            [dto.title, dto.description, category.name, category.nameEn]
              .filter(Boolean)
              .join(' '),
          ),
        },
      });
    }

    return this.prisma.product.create({
      data: {
        ...dto,
        searchText: normalizeSearchText(
          [dto.title, dto.description].filter(Boolean).join(' '),
        ),
      },
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Product ${id} not found`);
    }
  }
}
