import { prisma } from "../app/lib/prisma";

const TR_MAP: Record<string, string> = {
    "ı": "i", "ğ": "g", "ş": "s", "ö": "o", "ü": "u", "ç": "c",
    "İ": "i", "Ğ": "g", "Ş": "s", "Ö": "o", "Ü": "u", "Ç": "c",
};

function toSlug(name: string): string {
    return name
        .replace(/[ığşöüçİĞŞÖÜÇ]/g, (c) => TR_MAP[c] ?? c)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function main() {
    console.log("Seeding categories...");

    // Each entry: tr name (required) + optional en name.
    // Existing seeded data has English names in the `name` (legacy TR) field.
    // These will be replaced with real Turkish names in a later content step.
    const categories: { name: string; nameEn?: string }[] = [
        { name: "Electronics" },
        { name: "Clothing" },
        { name: "Books" },
        { name: "Home & Garden" },
        { name: "Sports" },
        { name: "Toys" },
        { name: "Health & Beauty" },
        { name: "Automotive" },
    ];

    for (const cat of categories) {
        const category = await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: { name: cat.name, nameEn: cat.nameEn ?? null },
        });

        // Upsert Turkish translation
        await prisma.categoryTranslation.upsert({
            where: { categoryId_locale: { categoryId: category.id, locale: "tr" } },
            update: { name: cat.name, slug: toSlug(cat.name) },
            create: { categoryId: category.id, locale: "tr", name: cat.name, slug: toSlug(cat.name) },
        });

        // Upsert English translation only if an EN name is provided
        if (cat.nameEn) {
            await prisma.categoryTranslation.upsert({
                where: { categoryId_locale: { categoryId: category.id, locale: "en" } },
                update: { name: cat.nameEn, slug: toSlug(cat.nameEn) },
                create: { categoryId: category.id, locale: "en", name: cat.nameEn, slug: toSlug(cat.nameEn) },
            });
        }
    }

    console.log("Categories seeded successfully.");

    // -------------------------------------------------------
    // FAQ Seed
    // -------------------------------------------------------
    console.log("Seeding FAQs...");

    const faqs = [
        {
            question: "Siparişimi ne zaman teslim alırım?",
            questionEn: "When will I receive my order?",
            answer: "Siparişleriniz onaylandıktan sonra genellikle 2-5 iş günü içinde teslim edilir. Kargo takip numarası e-posta ile iletilir.",
            answerEn: "Orders are usually delivered within 2-5 business days after confirmation. A tracking number will be sent to your email.",
            order: 1,
        },
        {
            question: "Ücretsiz kargo var mı?",
            questionEn: "Is there free shipping?",
            answer: "Belirli bir tutarın üzerindeki siparişlerde ücretsiz kargo sunulmaktadır. Güncel kargo ücretleri ve ücretsiz kargo eşiği ödeme sayfasında gösterilir.",
            answerEn: "Free shipping is available for orders above a certain amount. Current shipping fees and the free shipping threshold are displayed on the checkout page.",
            order: 2,
        },
        {
            question: "Ödeme yöntemleri nelerdir?",
            questionEn: "What payment methods are available?",
            answer: "Havale/EFT ile ödeme kabul edilmektedir. Sipariş verdikten sonra banka bilgilerimiz e-posta ile iletilir.",
            answerEn: "We accept bank transfer / EFT payments. After placing your order, our bank details will be sent to you via email.",
            order: 3,
        },
        {
            question: "İade ve değişim koşulları nelerdir?",
            questionEn: "What are the return and exchange conditions?",
            answer: "Ürünü teslim aldığınızdan itibaren 14 gün içinde iade talebinde bulunabilirsiniz. Ürünün kullanılmamış ve orijinal ambalajında olması gerekmektedir.",
            answerEn: "You can request a return within 14 days of receiving your product. The product must be unused and in its original packaging.",
            order: 4,
        },
        {
            question: "Siparişimi nasıl takip edebilirim?",
            questionEn: "How can I track my order?",
            answer: "Hesabınıza giriş yaparak 'Siparişlerim' sayfasından tüm siparişlerinizi ve kargo durumlarını takip edebilirsiniz.",
            answerEn: "You can track all your orders and their shipping status from the 'My Orders' page after logging into your account.",
            order: 5,
        },
        {
            question: "Sipariş verdikten sonra değişiklik yapabilir miyim?",
            questionEn: "Can I make changes after placing an order?",
            answer: "Sipariş onaylanmadan önce bizimle iletişime geçerek değişiklik talep edebilirsiniz. Onaylanan siparişlerde değişiklik yapılamamaktadır.",
            answerEn: "You can contact us to request changes before the order is confirmed. No changes can be made to confirmed orders.",
            order: 6,
        },
        {
            question: "Ürünlerin garantisi var mı?",
            questionEn: "Do products have a warranty?",
            answer: "Ürüne göre garanti süresi değişmektedir. Ürün sayfasında garanti bilgisi belirtilmişse o süre geçerlidir. Ayrıntılar için bizimle iletişime geçebilirsiniz.",
            answerEn: "Warranty periods vary by product. If warranty information is specified on the product page, that period applies. Contact us for details.",
            order: 7,
        },
        {
            question: "Hesabımı nasıl oluşturabilirim?",
            questionEn: "How do I create an account?",
            answer: "Sağ üst köşedeki 'Kayıt Ol' butonuna tıklayarak e-posta adresiniz ile kolayca hesap oluşturabilirsiniz. Google hesabınızla da giriş yapabilirsiniz.",
            answerEn: "Click the 'Register' button in the top right corner to easily create an account with your email. You can also sign in with your Google account.",
            order: 8,
        },
    ];

    for (const faq of faqs) {
        await prisma.faq.create({ data: { ...faq, isActive: true } });
    }

    console.log(`${faqs.length} FAQs seeded successfully.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
