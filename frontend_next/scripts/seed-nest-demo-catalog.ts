import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config, parse } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const SEED_KEY = "products-demo-20260717";
function getRequestedTotal() {
  const argument = process.argv.find((item) => item.startsWith("--total="));
  const value = argument?.split("=")[1];

  if (!value) return 500;

  const total = Number(value);

  if (!Number.isInteger(total) || total < 1) {
    throw new Error("--total pozitif bir tam sayı olmalıdır.");
  }

  return total;
}
const PRODUCT_COUNT = getRequestedTotal();
const IMAGE_COUNT = 50;
const STORAGE_FOLDER = `products/${SEED_KEY}`;
const ASSET_DIRECTORY = resolve(
  process.cwd(),
  "..",
  "backend_nest",
  "seed-assets",
  SEED_KEY,
);

config({ path: resolve(process.cwd(), ".env") });

type BaseProduct = {
  title: string;
  titleEn: string;
  category: string;
};

function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ç", "c")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replace(/\s+/g, " ")
    .trim();
}

const categories = [
  { key: "electronics", name: "Elektronik", nameEn: "Electronics" },
  { key: "home", name: "Ev Dekorasyonu", nameEn: "Home Decor" },
  { key: "kitchen", name: "Mutfak", nameEn: "Kitchen" },
  { key: "stationery", name: "Kırtasiye", nameEn: "Stationery" },
  { key: "gifts", name: "Hediye", nameEn: "Gifts" },
  { key: "sports", name: "Spor", nameEn: "Sports" },
  { key: "toys", name: "Oyuncak", nameEn: "Toys" },
  { key: "lighting", name: "Aydınlatma", nameEn: "Lighting" },
  { key: "garden", name: "Bahçe", nameEn: "Garden" },
  { key: "accessories", name: "Aksesuar", nameEn: "Accessories" },
] as const;

const baseProducts: BaseProduct[] = [
  {
    title: "Kablosuz Kulaklık",
    titleEn: "Wireless Headphones",
    category: "electronics",
  },
  {
    title: "Mekanik Klavye",
    titleEn: "Mechanical Keyboard",
    category: "electronics",
  },
  {
    title: "Kablosuz Fare",
    titleEn: "Wireless Mouse",
    category: "electronics",
  },
  {
    title: "Bluetooth Hoparlör",
    titleEn: "Bluetooth Speaker",
    category: "electronics",
  },
  {
    title: "Akıllı Spor Saati",
    titleEn: "Smart Fitness Watch",
    category: "electronics",
  },
  {
    title: "Anında Baskı Kamera",
    titleEn: "Instant Camera",
    category: "electronics",
  },
  {
    title: "Taşınabilir Güç Bankası",
    titleEn: "Portable Power Bank",
    category: "electronics",
  },
  {
    title: "Kablosuz Kulak İçi Kulaklık",
    titleEn: "Wireless Earbuds",
    category: "electronics",
  },
  {
    title: "Ayarlanabilir Masa Lambası",
    titleEn: "Adjustable Desk Lamp",
    category: "electronics",
  },
  {
    title: "USB-C Bağlantı İstasyonu",
    titleEn: "USB-C Docking Station",
    category: "electronics",
  },
  {
    title: "Seramik Kahve Kupası",
    titleEn: "Ceramic Coffee Mug",
    category: "kitchen",
  },
  {
    title: "Seramik Dekoratif Vazo",
    titleEn: "Decorative Ceramic Vase",
    category: "home",
  },
  {
    title: "Ahşap Fotoğraf Çerçevesi",
    titleEn: "Wooden Photo Frame",
    category: "home",
  },
  {
    title: "Minimal Duvar Saati",
    titleEn: "Minimal Wall Clock",
    category: "home",
  },
  {
    title: "Dokuma Saklama Sepeti",
    titleEn: "Woven Storage Basket",
    category: "home",
  },
  {
    title: "Çelik Termos Şişe",
    titleEn: "Steel Insulated Bottle",
    category: "kitchen",
  },
  {
    title: "Ceviz Servis Tepsisi",
    titleEn: "Walnut Serving Tray",
    category: "kitchen",
  },
  {
    title: "Kompakt Elektrikli Su Isıtıcısı",
    titleEn: "Compact Electric Kettle",
    category: "kitchen",
  },
  {
    title: "Cam Saklama Kabı Seti",
    titleEn: "Glass Storage Container Set",
    category: "kitchen",
  },
  {
    title: "Dekoratif Örgü Yastık",
    titleEn: "Decorative Knit Pillow",
    category: "home",
  },
  {
    title: "Noktalı Sert Kapak Defter",
    titleEn: "Dotted Hardcover Notebook",
    category: "stationery",
  },
  {
    title: "Pastel İşaretleme Kalemi Seti",
    titleEn: "Pastel Marker Set",
    category: "stationery",
  },
  {
    title: "Metal Masa Düzenleyici",
    titleEn: "Metal Desk Organizer",
    category: "stationery",
  },
  {
    title: "Ahşap Kalem Kutusu",
    titleEn: "Wooden Pencil Case",
    category: "stationery",
  },
  {
    title: "Geometrik Yapışkan Not Seti",
    titleEn: "Geometric Sticky Note Set",
    category: "stationery",
  },
  {
    title: "Minimal Dolma Kalem",
    titleEn: "Minimal Fountain Pen",
    category: "stationery",
  },
  {
    title: "Kurdeleli Hediye Kutusu",
    titleEn: "Ribbon Gift Box",
    category: "gifts",
  },
  {
    title: "Amber Cam Kokulu Mum",
    titleEn: "Amber Glass Scented Candle",
    category: "gifts",
  },
  {
    title: "Keçe Yıldız Anahtarlık",
    titleEn: "Felt Star Keychain",
    category: "gifts",
  },
  {
    title: "Dekoratif Bant Seti",
    titleEn: "Decorative Tape Set",
    category: "gifts",
  },
  {
    title: "Ayarlanabilir Dambıl Seti",
    titleEn: "Adjustable Dumbbell Set",
    category: "sports",
  },
  { title: "Yoga Matı", titleEn: "Yoga Mat", category: "sports" },
  {
    title: "Sporcu Su Şişesi",
    titleEn: "Sports Water Bottle",
    category: "sports",
  },
  {
    title: "Direnç Bandı Seti",
    titleEn: "Resistance Band Set",
    category: "sports",
  },
  {
    title: "Klasik Basketbol Topu",
    titleEn: "Classic Basketball",
    category: "sports",
  },
  {
    title: "Ahşap Halka Dizme Oyuncağı",
    titleEn: "Wooden Stacking Ring Toy",
    category: "toys",
  },
  { title: "Peluş Oyuncak Ayı", titleEn: "Plush Teddy Bear", category: "toys" },
  {
    title: "Ahşap Oyuncak Tren",
    titleEn: "Wooden Toy Train",
    category: "toys",
  },
  {
    title: "Renkli Yapı Blokları",
    titleEn: "Colorful Building Blocks",
    category: "toys",
  },
  { title: "Aile Kart Oyunu", titleEn: "Family Card Game", category: "toys" },
  {
    title: "Cam Sarkıt Lamba",
    titleEn: "Glass Pendant Lamp",
    category: "lighting",
  },
  {
    title: "Başucu Masa Lambası",
    titleEn: "Bedside Table Lamp",
    category: "lighting",
  },
  {
    title: "Dış Mekân Duvar Feneri",
    titleEn: "Outdoor Wall Lantern",
    category: "lighting",
  },
  {
    title: "Seramik Saksıda Sukulent",
    titleEn: "Potted Succulent",
    category: "garden",
  },
  {
    title: "Metal Sulama Kabı",
    titleEn: "Metal Watering Can",
    category: "garden",
  },
  {
    title: "Bambu Bahçe Aleti Seti",
    titleEn: "Bamboo Garden Tool Set",
    category: "garden",
  },
  {
    title: "Minimal Çapraz Askılı Çanta",
    titleEn: "Minimal Crossbody Bag",
    category: "accessories",
  },
  {
    title: "Yuvarlak Çerçeveli Gözlük",
    titleEn: "Round Frame Sunglasses",
    category: "accessories",
  },
  {
    title: "İnce Kartlık",
    titleEn: "Slim Card Holder",
    category: "accessories",
  },
  { title: "Örgü Bere", titleEn: "Knitted Beanie", category: "accessories" },
];

const colors = [
  { name: "Siyah", hex: "#1A1A1A" },
  { name: "Beyaz", hex: "#F5F5F5" },
  { name: "Kırmızı", hex: "#C8102E" },
  { name: "Mavi", hex: "#2563EB" },
  { name: "Yeşil", hex: "#16A34A" },
  { name: "Sarı", hex: "#EAB308" },
  { name: "Mor", hex: "#7C3AED" },
  { name: "Turuncu", hex: "#EA580C" },
];

function padded(value: number, width: number) {
  return String(value).padStart(width, "0");
}

async function uploadImages() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || "products";
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const uploaded: { index: number; path: string; url: string }[] = [];

  for (let index = 1; index <= IMAGE_COUNT; index++) {
    const filename = `demo-${padded(index, 3)}.webp`;
    const storagePath = `${STORAGE_FOLDER}/${filename}`;
    const file = await readFile(resolve(ASSET_DIRECTORY, filename));
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
    if (error)
      throw new Error(`Upload failed for ${filename}: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    uploaded.push({ index, path: storagePath, url: data.publicUrl });
    if (index % 10 === 0)
      console.log(`Uploaded ${index}/${IMAGE_COUNT} images`);
  }

  await writeFile(
    resolve(ASSET_DIRECTORY, "manifest.json"),
    JSON.stringify({ seedKey: SEED_KEY, bucket, images: uploaded }, null, 2),
    "utf8",
  );
  return uploaded.map((image) => image.url);
}

async function createDemoCatalog(imageUrls: string[]) {
  const backendEnv = parse(
    await readFile(resolve(process.cwd(), "..", "backend_nest", ".env")),
  );
  const databaseUrl = backendEnv.DATABASE_URL;
  if (!databaseUrl)
    throw new Error("DATABASE_URL is missing in backend_nest/.env");

  const pool = new Pool({ connectionString: databaseUrl, max: 3 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.category.createMany({
      data: categories.map((category) => ({
        id: `${SEED_KEY}-category-${category.key}`,
        name: category.name,
        nameEn: category.nameEn,
      })),
      skipDuplicates: true,
    });

    await prisma.user.createMany({
      data: Array.from({ length: 20 }, (_, index) => ({
        id: `${SEED_KEY}-user-${padded(index + 1, 2)}`,
        email: `demo-seed-${padded(index + 1, 2)}@example.invalid`,
        name: `Demo Kullanıcı ${index + 1}`,
        locale: "tr",
      })),
      skipDuplicates: true,
    });

    const existing = new Set(
      (
        await prisma.product.findMany({
          where: { id: { startsWith: `${SEED_KEY}-product-` } },
          select: { id: true },
        })
      ).map((product) => product.id),
    );

    let created = 0;
    for (let batchStart = 1; batchStart <= PRODUCT_COUNT; batchStart += 10) {
      const operations = [];
      for (
        let productNumber = batchStart;
        productNumber < Math.min(batchStart + 10, PRODUCT_COUNT + 1);
        productNumber++
      ) {
        const id = `${SEED_KEY}-product-${padded(productNumber, 4)}`;
        if (existing.has(id)) continue;

        const baseIndex = (productNumber - 1) % baseProducts.length;
        const base = baseProducts[baseIndex];
        const category = categories.find((item) => item.key === base.category);
        if (!category) throw new Error(`Unknown category: ${base.category}`);
        const series =
          Math.floor((productNumber - 1) / baseProducts.length) + 1;
        const price = 1299 + ((productNumber * 7919) % 120000);
        const thumbnail = imageUrls[baseIndex];
        const gallery = [
          imageUrls[baseIndex],
          imageUrls[(baseIndex + 1) % imageUrls.length],
          imageUrls[(baseIndex + 2) % imageUrls.length],
        ];
        const productColors = [0, 1, 2].map(
          (offset) => colors[(productNumber + offset * 3) % colors.length],
        );

        operations.push(
          prisma.product.create({
            data: {
              id,
              title: `${base.title} - Seri ${series}`,
              description: `${base.title} için performans testi demo ürünü. Seed: ${SEED_KEY}.`,
              searchText: normalizeSearchText(
                `${base.title} ${base.titleEn} ${category.name} ${category.nameEn} performans testi demo ürünü`,
              ),
              price,
              salePrice:
                productNumber % 4 === 0 ? Math.round(price * 0.85) : null,
              stock: 5 + ((productNumber * 13) % 96),
              isActive: true,
              categoryId: `${SEED_KEY}-category-${base.category}`,
              thumbnail,
              shippingDays: `${2 + (productNumber % 4)}-${4 + (productNumber % 5)}`,
              images: {
                create: gallery.map((url, imageIndex) => ({
                  id: `${id}-image-${imageIndex + 1}`,
                  url,
                })),
              },
              variants: {
                create: productColors.map((color, variantIndex) => ({
                  id: `${id}-variant-${variantIndex + 1}`,
                  color: color.name,
                  colorHex: color.hex,
                  stock: 1 + ((productNumber * (variantIndex + 5)) % 35),
                  images: [
                    gallery[variantIndex],
                    gallery[(variantIndex + 1) % gallery.length],
                  ],
                })),
              },
              translations: {
                create: [
                  {
                    locale: "tr",
                    title: `${base.title} - Seri ${series}`,
                    description: `${base.title} için performans testi demo ürünü.`,
                  },
                  {
                    locale: "en",
                    title: `${base.titleEn} - Series ${series}`,
                    description: `Performance test demo product for ${base.titleEn}.`,
                  },
                ],
              },
              reviews: {
                create: [0, 1].map((reviewIndex) => ({
                  id: `${id}-review-${reviewIndex + 1}`,
                  userId: `${SEED_KEY}-user-${padded(((productNumber + reviewIndex * 7) % 20) + 1, 2)}`,
                  rating: 1 + ((productNumber + reviewIndex * 2) % 5),
                  comment:
                    reviewIndex === 0
                      ? "Demo performans değerlendirmesi."
                      : "Katalog ve filtre testi için oluşturuldu.",
                })),
              },
            },
          }),
        );
      }

      if (operations.length) {
        await prisma.$transaction(operations);
        created += operations.length;
      }
      console.log(
        `Seed progress: ${Math.min(batchStart + 9, PRODUCT_COUNT)}/${PRODUCT_COUNT}`,
      );
    }

    const [products, images, variants, reviews, translations] =
      await Promise.all([
        prisma.product.count({
          where: { id: { startsWith: `${SEED_KEY}-product-` } },
        }),
        prisma.productImage.count({
          where: { productId: { startsWith: `${SEED_KEY}-product-` } },
        }),
        prisma.productVariant.count({
          where: { productId: { startsWith: `${SEED_KEY}-product-` } },
        }),
        prisma.review.count({
          where: { productId: { startsWith: `${SEED_KEY}-product-` } },
        }),
        prisma.productTranslation.count({
          where: { productId: { startsWith: `${SEED_KEY}-product-` } },
        }),
      ]);
    console.log(
      `SEED_COMPLETE createdNow=${created} products=${products} images=${images} variants=${variants} reviews=${reviews} translations=${translations}`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function main() {
  if (baseProducts.length !== IMAGE_COUNT) {
    throw new Error(
      `Expected ${IMAGE_COUNT} base products, found ${baseProducts.length}`,
    );
  }
  const imageUrls = await uploadImages();
  await createDemoCatalog(imageUrls);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
