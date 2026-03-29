
import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'test@test.com';
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            const updated = await prisma.user.update({
                where: { email },
                data: { role: 'ADMIN' }
            });
            console.log(`User ${email} promoted to ADMIN.`);
        } else {
            console.log(`User ${email} not found.`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
