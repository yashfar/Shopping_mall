# Products NestJS Uygulama Dokümanı

Son güncelleme: 16 Temmuz 2026

## 1. Amaç

Bu çalışmanın amacı, mevcut Next.js API route'larına ve mevcut `/products`
sayfasına dokunmadan bağımsız bir NestJS backend ve onu kullanan yeni bir
Next.js sayfası oluşturmaktır.

Yeni sayfa:

```text
/products-nest
```

Bu sayfa ürün verisini Next.js `app/api/*` route'larından değil, ayrı çalışan
NestJS REST API'sinden alır.

Temel sınırlar:

- `frontend_next/app/api/*` route'ları korunur.
- Mevcut Server Component'ler korunur.
- Mevcut `/products` sayfası değişmez.
- Next.js ve NestJS aynı Neon PostgreSQL veritabanını kullanır.
- Veritabanı migration'larının sahibi `frontend_next` olmaya devam eder.
- `backend_nest` migration çalıştırmaz; mevcut tabloları okur ve yazar.

## 2. Ana mimari

```text
Tarayıcı
   |
   | GET /products, /products/filters, /products/export/xlsx
   v
Next.js /products-nest Client Component
   |
   | HTTP + JSON/XLSX
   v
NestJS ProductsController
   |
   v
ProductsService
   |
   v
PrismaService + PrismaPg + pg.Pool
   |
   v
Neon PostgreSQL
```

Geliştirme ortamındaki varsayılan adresler:

```text
Next.js: http://localhost:3000
NestJS:  http://localhost:4000
```

## 3. Proje dizinleri

```text
Shopping_mall/
├── frontend_next/   # Mevcut Next.js uygulaması
├── backend_nest/    # Yeni NestJS + Prisma backend
└── PRODUCTS_NEST_IMPLEMENTATION.md
```

## 4. Backend: NestJS ve Prisma

### 4.1 Başlangıç ve modüller

İlgili dosyalar:

```text
backend_nest/src/main.ts
backend_nest/src/app.module.ts
backend_nest/src/prisma/prisma.module.ts
backend_nest/src/prisma/prisma.service.ts
```

`main.ts`:

- NestJS uygulamasını başlatır.
- Varsayılan olarak port `4000` kullanır.
- CORS'u etkinleştirir.
- Global `ValidationPipe` kullanır.
- `whitelist: true` ile DTO'da tanımlı olmayan alanları temizler.
- `transform: true` ile query string değerlerinin DTO tiplerine dönüşmesini
  sağlar.

`PrismaModule` globaldir. Bu nedenle feature modülleri `PrismaService`'i kendi
modüllerine tekrar import etmeden dependency injection ile kullanabilir.

`PrismaService`:

- `DATABASE_URL` değerini environment'tan okur.
- `PrismaPg` adapter'ı kullanır.
- `pg.Pool` ile PostgreSQL bağlantı havuzu oluşturur.
- Modül açılırken bağlanır.
- Uygulama kapanırken Prisma ve Pool bağlantılarını kapatır.

### 4.2 Prisma schema yaklaşımı

Dosya:

```text
backend_nest/prisma/schema.prisma
```

Backend schema'sında yalnızca bu özellik için gerekli modeller bulunur:

```text
Category
Product
ProductImage
ProductVariant
Review
```

Backend schema'sı ortak veritabanının tamamını yönetmez. Migration kaynağı:

```text
frontend_next/prisma/schema.prisma
```

Backend tarafında şu komut kullanılabilir:

```bash
npx prisma generate
```

Ancak şu komut backend tarafında çalıştırılmamalıdır:

```bash
npx prisma migrate dev
```

### 4.3 Products modülü

```text
backend_nest/src/products/
├── dto/
│   ├── create-product.dto.ts
│   ├── list-products-query.dto.ts
│   └── export-products-query.dto.ts
├── products.controller.ts
├── products.module.ts
├── products.service.ts
└── products-xlsx.serializer.ts
```

Sorumluluklar:

- `ProductsController`: HTTP route'larını tanımlar.
- `ProductsService`: filtre, pagination ve Prisma sorgularını çalıştırır.
- DTO'lar: body ve query değerlerini doğrular.
- `ProductsXlsxSerializer`: ilişkili ürün kayıtlarını XLSX workbook'a çevirir.

## 5. API sözleşmeleri

### 5.1 Ürün listesi

```http
GET /products
```

Desteklenen query parametreleri:

```text
page        number, minimum 1, varsayılan 1
pageSize    number, 1-100, varsayılan 12
categoryId  string
color       string
minPrice    number, ana para birimi
maxPrice    number, ana para birimi
rating      integer, 1-5
sort        newest | price_asc | price_desc
```

Örnek:

```http
GET /products?page=1&pageSize=12&categoryId=abc&color=Siyah&minPrice=100&rating=4
```

Fiyat query değerleri ana para birimidir. Service bunları veritabanındaki cent
değerine çevirir:

```text
100.50 -> 10050 cent
```

Response:

```json
{
  "products": [],
  "page": 1,
  "pageSize": 12,
  "hasMore": false
}
```

Liste yalnızca `isActive: true` ürünleri döndürür.

### 5.2 Filtre metadata'sı

```http
GET /products/filters
```

Response şu bilgileri sağlar:

- En az bir aktif ürünü bulunan kategoriler
- Yalnızca aktif ürünlere ait varyant renkleri
- Aktif ürünlerin minimum ve maksimum fiyatı

Fiyat aralığı cent olarak döner.

### 5.3 Ürün detayı

```http
GET /products/:id
```

Kategori, görseller, varyantlar ve değerlendirmeler dahil tek ürün döndürür.
Kayıt bulunamazsa `404 Not Found` döner.

Not: Bu endpoint şu anda `isActive` kontrolü yapmaz. ID biliniyorsa pasif ürün
alınabilir. Bunun kalıcı davranış olup olmadığı ileride kararlaştırılmalıdır.

### 5.4 Ürün oluşturma

```http
POST /products
Content-Type: application/json
```

Zorunlu alanlar:

```text
title
price (cent)
```

Opsiyonel alanlar:

```text
description
salePrice
stock
isActive
categoryId
thumbnail
```

`categoryId` gönderilirse kategori önce veritabanında kontrol edilir. Kategori
yoksa genel Prisma `500` hatası yerine anlaşılır bir `400 Bad Request` döner.

### 5.5 Ürün silme

```http
DELETE /products/:id
```

Başarılı response:

```http
204 No Content
```

Bu endpoint'in Prisma hata ayrımı henüz tamamlanmamıştır. Mevcut `catch` bütün
silme hatalarını `404` olarak çevirebilir. Foreign key, bağlantı ve beklenmeyen
Prisma hataları ileride ayrı ele alınmalıdır.

### 5.6 XLSX export

```http
GET /products/export/xlsx
```

Listeyle aynı filtreleri kabul eder, fakat `page` ve `pageSize` kabul etmez.
Tek istek içinde filtreye uyan bütün aktif ürünler export edilir.

Örnek:

```http
GET /products/export/xlsx?categoryId=abc&color=Siyah&rating=4
```

Response:

```text
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="products-YYYY-MM-DD.xlsx"
```

## 6. Filtre ve pagination düzeltmeleri

### 6.1 Rating filtresi

İlk uygulamada şu sıra kullanılmıştı:

```text
skip/take -> rating filtresi
```

Bu sıra sayfaların eksik görünmesine ve `hasMore` değerinin yanlış olmasına
neden oluyordu.

Güncel sıra:

```text
Review.groupBy + average rating
        |
        v
Uygun productId listesi
        |
        v
Product where koşulu
        |
        v
skip/take ve hasMore
```

Rating artık pagination'dan önce uygulanır.

### 6.2 Category filtresi

İlk sürüm kategori adını gönderiyordu. Güncel sözleşme kategori ID'sini kullanır:

```text
categoryId=<Category.id>
```

Bu yaklaşım kategori adı değiştiğinde filtre sözleşmesinin bozulmasını önler.

### 6.3 Category radio davranışı

Kategori filtresi tek seçimlidir. Bu nedenle checkbox yerine aynı `name`
değerine sahip radio input'lar kullanılır. `Tümü` seçeneği `categoryId` filtresini
temizler.

### 6.4 Color filtresi

Prisma koşulu ürünün en az bir eşleşen varyantı olmasını ister:

```text
variants.some(color equals, case-insensitive)
```

Renk metadata'sı yalnızca aktif ürünlerin varyantlarından oluşturulur.

## 7. XLSX export tasarımı

XML export denendi; ancak Excel, iç içe `images` ve `variants` listelerini düz
tabloya çevirirken ana ürün alanlarını tekrar gösterdi. Veritabanı ilişkilerini
korumak ve ürün tekrarlarını önlemek için export XLSX'e çevrildi.

Kullanılan runtime paketi:

```text
exceljs
```

Workbook sheet'leri:

### Products

Her ürün yalnızca bir satırdır:

```text
id, title, description, priceCent, salePriceCent, stock, isActive,
categoryId, thumbnail, shippingDays, createdAt, updatedAt
```

### Categories

Yalnızca export edilen ürünlerin referans verdiği kategorileri içerir:

```text
id, name, nameEn
```

### ProductImages

```text
id, productId, url, createdAt
```

### ProductVariants

```text
id, productId, color, colorHex, stock, imagesJson, createdAt, updatedAt
```

PostgreSQL/Prisma `String[]` olan varyant görselleri `imagesJson` hücresinde JSON
array olarak saklanır.

### Reviews

```text
id, productId, userId, rating, comment, createdAt
```

İlişkiler `productId` ve `categoryId` ile korunur. Fiyat hücreleri string değil,
numeric cent değeridir.

Gerçek veritabanıyla yapılan doğrulamadaki kayıt sayıları:

```text
Products:         23
Categories:        8
ProductImages:   169
ProductVariants:  81
Reviews:           2
```

Bu sayılar test anındaki veritabanı durumudur ve zamanla değişebilir.

## 8. Frontend: `/products-nest`

Dosyalar:

```text
frontend_next/app/(main)/products-nest/page.tsx
frontend_next/app/(main)/products-nest/ProductsNestClient.tsx
```

`page.tsx` route ve metadata sağlayan küçük Server Component'tir.

`ProductsNestClient.tsx` şunları yönetir:

- NestJS base URL
- Ürün listesini fetch etme
- Filtre metadata'sını fetch etme
- Category filtresi
- Color filtresi
- Min/max fiyat filtresi ve istemci doğrulaması
- Minimum müşteri puanı filtresi
- Pagination
- Loading, error ve empty state
- XLSX indirme
- Filtre panelini gösterme/gizleme

Backend adresi:

```ts
process.env.NEXT_PUBLIC_NEST_API_URL || "http://localhost:4000"
```

Liste isteği `page` ve `pageSize` içerir. XLSX export isteği aynı aktif filtreleri
kullanır, fakat pagination parametrelerini göndermez.

## 9. Lokal çalıştırma

Backend:

```bash
cd backend_nest
npm install
npx prisma generate
npm run start:dev
```

Frontend:

```bash
cd frontend_next
npm install
npm run dev
```

Sayfa:

```text
http://localhost:3000/products-nest
```

Backend kontrolü:

```text
http://localhost:4000/
http://localhost:4000/products?page=1&pageSize=12
http://localhost:4000/products/filters
http://localhost:4000/products/export/xlsx
```

## 10. Environment değişkenleri

### Backend

```env
DATABASE_URL=postgresql://...
PORT=4000
```

`PORT` lokalde opsiyoneldir; varsayılan `4000` kullanılır.

PostgreSQL SSL uyarısını geleceğe dayanıklı biçimde önlemek için URL'de şu değer
önerilir:

```text
sslmode=verify-full
```

### Frontend

```env
NEXT_PUBLIC_NEST_API_URL=http://localhost:4000
```

`DATABASE_URL` hiçbir zaman `NEXT_PUBLIC_` prefix'i ile tanımlanmamalıdır.

## 11. Vercel ve branch deployment

`design_new_structure` branch'ini diğer Vercel projelerine dokunmadan test etmek
için aynı GitHub repository'sinden iki ayrı Vercel projesi önerilir.

Frontend projesi:

```text
Root Directory: frontend_next
Production Branch: design_new_structure
Environment:
NEXT_PUBLIC_NEST_API_URL=https://<backend-domain>
```

Backend projesi:

```text
Root Directory: backend_nest
Production Branch: design_new_structure
Environment:
DATABASE_URL=<Neon pooled connection URL>
```

Vercel'deki `No Next.js version detected` hatası, repository root'u yerine
`frontend_next` klasörünün Root Directory olarak seçilmemesinden kaynaklanır.

## 12. Yapılan doğrulamalar

Çalışma sırasında gerçekleştirilen kontroller:

- NestJS build başarılı.
- Frontend TypeScript `tsc --noEmit` başarılı.
- Değiştirilen frontend ve backend dosyalarının lint kontrolü başarılı.
- Mevcut Jest testi başarılı.
- Rating filtresi pagination'dan önce çalışacak şekilde düzeltildi.
- Gerçek Neon verisiyle XLSX üretildi ve yeniden okundu.
- Workbook'taki beş sheet doğrulandı.
- `priceCent` hücresinin gerçek number olduğu doğrulandı.

Mevcut Jest testi yalnızca varsayılan `Hello World` davranışını kapsar. Products
özelliğinin otomatik test kapsamı henüz yeterli değildir.

## 13. Bilinen açık konular

### Güvenlik

`POST /products` ve `DELETE /products/:id` şu anda authentication/authorization
olmadan açıktır. Lokal geliştirme dışında public olarak kullanılmamalıdır.

İleride önerilen çözüm:

- JWT veya güvenli servis kimliği
- NestJS Guard
- Admin role kontrolü

CORS şu anda bütün origin'lere açıktır. Production'da frontend domainleriyle
sınırlandırılmalıdır.

### DELETE hata yönetimi

Silme işlemindeki Prisma hata kodları ayrıştırılmalıdır:

```text
P2025 -> 404 Not Found
P2003 -> 409 Conflict
Diğer -> gerçek 500/internal hata akışı
```

### Fiyat davranışı

Liste filtresi şu anda `price` alanını kullanır. Bir ürünün `salePrice` değeri
varsa filtrelemenin normal fiyatı mı, ödenecek fiyatı mı temel alacağı ayrıca
kararlaştırılmalıdır.

### Race condition

Kullanıcı filtreleri çok hızlı değiştirirse eski fetch yanıtı daha yeni state'in
üzerine yazabilir. İleride `AbortController` ile eski isteklerin iptal edilmesi
önerilir.

### Component boyutu

`ProductsNestClient.tsx` birden fazla sorumluluk taşımaktadır. Özellik büyürse şu
parçalara ayrılabilir:

```text
ProductsFilters
ProductNestCard
RatingStars
ProductsPagination
products-nest.types
```

### Paket güvenlik uyarıları

`exceljs` kurulumu sonrasında npm dolaylı bağımlılıklar için moderate seviyede
uyarılar bildirmiştir. Kırıcı değişiklik riski nedeniyle `npm audit fix --force`
otomatik çalıştırılmamıştır. Production öncesi audit sonuçları ayrı incelenmelidir.

### Secret geçmişi

Repository'deki `.history` altında geçmiş `.env` kopyaları track edilmiş olabilir.
Secret'lar doğrulanmalı, gerekiyorsa rotate edilmeli ve Git geçmişi güvenli bir
planla temizlenmelidir.

## 14. Sonraki önerilen adımlar

1. ProductsService ve ProductsController için unit/e2e testleri eklemek.
2. Rating + pagination kombinasyonunu otomatik test etmek.
3. DELETE Prisma hata kodlarını doğru HTTP status'larına çevirmek.
4. POST ve DELETE endpoint'lerine authentication ve authorization eklemek.
5. `AbortController` ile frontend fetch yarışlarını önlemek.
6. CORS'u deployment domainleriyle sınırlandırmak.
7. Vercel frontend/backend projelerini ayrı root directory ile deploy etmek.
8. Prisma sürümlerini ve schema subset senkronizasyonunu düzenli kontrol etmek.

