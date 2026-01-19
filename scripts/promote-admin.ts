import { prisma } from "../app/lib/prisma";

async function promoteToAdmin(email: string) {
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: "ADMIN" },
        });

        console.log("✅ User promoted to ADMIN:");
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}`);
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Kullanım: Email adresinizi buraya yazın
const emailToPromote = process.argv[2];

if (!emailToPromote) {
    console.log("❌ Kullanım: pnpm tsx scripts/promote-admin.ts <email>");
    process.exit(1);
}

promoteToAdmin(emailToPromote);
