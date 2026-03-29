
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('Launching browser (Part 3)...');
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1024']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1024 });

        const baseUrl = 'http://localhost:3000';
        const outputDir = path.join(__dirname, '../public/docs/images');

        // Login
        await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' });
        await page.type('#email', 'test@test.com');
        await page.type('#password', '123456789');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0' })
        ]);

        // 9. Banner Settings
        console.log('Navigating to Banner Settings...');
        try {
            await page.goto(`${baseUrl}/admin/banners/settings`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '9_admin_banner_settings.png') });
        } catch (e) {
            console.error('Error on Banner Settings:', e.message);
        }

        // 10. Profile Dropdown Items
        console.log('Capturing Profile Subpages...');
        try {
            await page.goto(`${baseUrl}/profile/orders`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '10_profile_orders.png') });

            await page.goto(`${baseUrl}/profile/addresses`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '11_profile_addresses.png') });
        } catch (e) {
            console.error('Error on Profile Pages:', e.message);
        }

        await browser.close();
        console.log('Part 3 screenshots captured.');
    } catch (err) {
        console.error('Fatal Error:', err);
    }
})();
