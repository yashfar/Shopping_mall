// Script to update existing BannerSettings with arrowDisplay field
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBannerSettings() {
    try {
        console.log('🔍 Checking for existing banner settings...');

        const settings = await prisma.bannerSettings.findFirst();

        if (settings) {
            console.log('📝 Found existing settings:', settings);

            // Update with arrowDisplay if it doesn't exist
            const updated = await prisma.bannerSettings.update({
                where: { id: settings.id },
                data: {
                    arrowDisplay: settings.arrowDisplay || 'hover',
                },
            });

            console.log('✅ Updated settings:', updated);
        } else {
            console.log('ℹ️  No settings found. Creating default settings...');

            const created = await prisma.bannerSettings.create({
                data: {
                    animationSpeed: 500,
                    slideDelay: 3000,
                    animationType: 'slide',
                    loop: true,
                    arrowDisplay: 'hover',
                },
            });

            console.log('✅ Created default settings:', created);
        }

        console.log('🎉 Done!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateBannerSettings();
