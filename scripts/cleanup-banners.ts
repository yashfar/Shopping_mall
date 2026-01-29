import 'dotenv/config';
import { prisma } from '../app/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
    // Check if user passed an argument
    const mode = process.argv[2]; // e.g. "all"

    if (mode === 'all') {
        console.log("!!! DELETING ALL BANNERS (Database & Files) !!!");

        // 1. Get all banners to know which files to delete (or we can just wipe the dir)
        // But safer to rely on DB records to delete associated files + scan dir for orphans if needed.
        // Let's just delete all records and then empty the directory.

        // Delete all banner records
        const { count } = await prisma.banner.deleteMany({});
        console.log(`Deleted ${count} banner records from database.`);

        // Delete all files in uploads/banners
        const bannerDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
        if (fs.existsSync(bannerDir)) {
            const files = fs.readdirSync(bannerDir);
            for (const file of files) {
                // simple check to avoid deleting hidden files or subdirs if any, though uploads/banners should be flat
                try {
                    fs.unlinkSync(path.join(bannerDir, file));
                    console.log(`Deleted file: ${file}`);
                } catch (err) {
                    console.error(`Failed to delete ${file}:`, err);
                }
            }
        }
        console.log("All banners cleared.");

    } else {
        // INVALID CLEANUP MODE (Default)
        console.log("Checking for invalid banners (missing files)...");

        const banners = await prisma.banner.findMany();
        const publicDir = path.join(process.cwd(), 'public');

        let deletedCount = 0;

        for (const banner of banners) {
            const header = banner.imageUrl.startsWith('/') ? banner.imageUrl.slice(1) : banner.imageUrl;
            const absolutePath = path.join(publicDir, header);

            if (!fs.existsSync(absolutePath)) {
                console.log(`File missing for banner ${banner.id}: ${banner.imageUrl}`);

                await prisma.banner.delete({
                    where: { id: banner.id }
                });
                console.log(`  -> Deleted banner record ${banner.id}`);
                deletedCount++;
            }
        }
        console.log(`Cleanup complete. Deleted ${deletedCount} invalid banner records.`);
        console.log("To delete ALL banners, run with argument: all");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
