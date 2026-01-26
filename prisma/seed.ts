import { prisma } from "../app/lib/prisma";

// ============================================================================
// 📌 Helper: Get or Create Category
// ============================================================================
async function getOrCreateCategory(name: string): Promise<string> {
    const existing = await prisma.category.findUnique({
        where: { name },
    });

    if (existing) {
        return existing.id;
    }

    const created = await prisma.category.create({
        data: { name },
    });

    console.log(`📁 Created new category: ${name}`);
    return created.id;
}

// ============================================================================
// 📌 Product Data
// ============================================================================
const products = [
    // Electronics
    {
        title: "Wireless Bluetooth Headphones",
        description: "Premium noise-cancelling headphones with 30-hour battery life. Crystal clear sound quality with deep bass and comfortable ear cushions.",
        price: 7999, // $79.99 (stored in cents)
        category: "Electronics",
        thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        images: [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800",
        ],
    },
    {
        title: "Smart Watch Pro",
        description: "Advanced fitness tracking, heart rate monitor, GPS, and smartphone notifications. Water-resistant up to 50m.",
        price: 24999,
        category: "Electronics",
        thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        images: [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        ],
    },
    {
        title: "4K Ultra HD Webcam",
        description: "Professional webcam with auto-focus, built-in microphone, and adjustable lighting. Perfect for streaming and video calls.",
        price: 12999,
        category: "Electronics",
        thumbnail: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800",
        images: [
            "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800",
        ],
    },

    // Clothing
    {
        title: "Classic Denim Jacket",
        description: "Timeless denim jacket with a modern fit. Made from premium cotton denim. Perfect for casual wear.",
        price: 5999,
        category: "Clothing",
        thumbnail: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
        images: [
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
        ],
    },
    {
        title: "Premium Cotton T-Shirt",
        description: "Soft, breathable 100% organic cotton t-shirt. Available in multiple colors. Perfect everyday wear.",
        price: 1999,
        category: "Clothing",
        thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
        images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
        ],
    },

    // Books
    {
        title: "The Art of Programming",
        description: "Comprehensive guide to modern software development. Covers algorithms, data structures, and best practices.",
        price: 3999,
        category: "Books",
        thumbnail: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800",
        images: [
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800",
        ],
    },

    // Home & Garden
    {
        title: "Smart LED Light Bulbs (4-Pack)",
        description: "WiFi-enabled color-changing LED bulbs. Control via smartphone app. Energy-efficient and long-lasting.",
        price: 4999,
        category: "Home & Garden",
        thumbnail: "https://images.unsplash.com/photo-1550985616-10810253b84d?w=800",
        images: [
            "https://images.unsplash.com/photo-1550985616-10810253b84d?w=800",
        ],
    },
    {
        title: "Indoor Plant Collection",
        description: "Set of 3 easy-care indoor plants with decorative pots. Perfect for home or office decoration.",
        price: 3499,
        category: "Home & Garden",
        thumbnail: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800",
        images: [
            "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800",
        ],
    },

    // Sports
    {
        title: "Yoga Mat Premium",
        description: "Non-slip, eco-friendly yoga mat with extra cushioning. Includes carrying strap. Perfect for yoga, pilates, and stretching.",
        price: 3999,
        category: "Sports",
        thumbnail: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800",
        images: [
            "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800",
        ],
    },

    // Toys
    {
        title: "Educational Building Blocks",
        description: "200-piece creative building block set. Develops creativity, motor skills, and problem-solving. Ages 3+.",
        price: 2499,
        category: "Toys",
        thumbnail: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800",
        images: [
            "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800",
        ],
    },

    // Health & Beauty
    {
        title: "Skincare Gift Set",
        description: "Complete skincare routine with cleanser, toner, serum, and moisturizer. Suitable for all skin types.",
        price: 5999,
        category: "Health & Beauty",
        thumbnail: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800",
        images: [
            "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800",
        ],
    },

    // Automotive
    {
        title: "Car Phone Mount",
        description: "Universal dashboard and windshield phone holder. 360-degree rotation. Fits all smartphone sizes.",
        price: 1999,
        category: "Automotive",
        thumbnail: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
        images: [
            "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
        ],
    },
];

// ============================================================================
// 📌 Main Seed Function
// ============================================================================
async function main() {
    console.log("🌱 Starting database seeding...");

    for (const product of products) {
        try {
            // 1. Get or create category
            const categoryId = await getOrCreateCategory(product.category);

            // 2. Check if product exists
            const existingProduct = await prisma.product.findFirst({
                where: { title: product.title },
            });

            if (existingProduct) {
                console.log(`__ Skipping existing product: ${product.title}`);
                continue;
            }

            // 3. Create product with nested images
            const createdProduct = await prisma.product.create({
                data: {
                    title: product.title,
                    description: product.description,
                    price: product.price,
                    stock: 50, // Default stock
                    categoryId: categoryId,
                    thumbnail: product.thumbnail,
                    // Nested create for images
                    images: {
                        create: product.images.map((url) => ({
                            url,
                        })),
                    },
                },
            });

            console.log(`✅ Created product: ${createdProduct.title}`);
        } catch (error) {
            console.error(`❌ Error creating product ${product.title}:`, error);
        }
    }

    console.log("🎉 Database seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Fatal error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
