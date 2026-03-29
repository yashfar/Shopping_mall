
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('Launching browser (Part 2)...');
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1024']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1024 });

        const baseUrl = 'http://localhost:3000';
        const outputDir = path.join(__dirname, '../public/docs/images');

        // Login again
        console.log('Logging in...');
        await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' });
        await page.type('#email', 'test@test.com');
        await page.type('#password', '123456789');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0' })
        ]);
        console.log('Logged in.');

        // 7. Add Product
        console.log('Navigating to Add Product...');
        try {
            await page.goto(`${baseUrl}/admin/products/new`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '7_admin_add_product.png') });
        } catch (e) {
            console.error('Error on Add Product:', e.message);
        }

        // 8. Edit Product
        console.log('Finding product to edit...');
        try {
            // Find valid product ID first
            await page.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle0' });

            // Look for edit link
            const editLink = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href^="/admin/products/"]'));
                // Filter out /new and ensure it has an ID
                const editUrl = links.find(el => {
                    const href = el.getAttribute('href');
                    const parts = href.split('/');
                    const lastPart = parts[parts.length - 1];
                    return lastPart !== 'new' && lastPart !== 'products';
                });
                return editUrl ? editUrl.getAttribute('href') : null;
            });

            if (editLink) {
                console.log(`Navigating to Edit Product: ${editLink}`);
                await page.goto(`${baseUrl}${editLink}`, { waitUntil: 'networkidle0' });
                await page.screenshot({ path: path.join(outputDir, '8_admin_edit_product.png') });
            } else {
                console.log('No edit link found, skipping 8_admin_edit_product');
            }
        } catch (e) {
            console.error('Error on Edit Product:', e.message);
        }

        // 9. Banner Settings
        console.log('Navigating to Banner Settings...');
        try {
            await page.goto(`${baseUrl}/admin/banners/settings`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '9_admin_banner_settings.png') });
        } catch (e) {
            console.error('Error on Banner Settings:', e.message);
        }

        // 10. Profile Dropdown Items (Orders, Addresses)
        console.log('Capturing Profile Subpages...');
        try {
            // Note: Adjust URLs based on actual routing
            await page.goto(`${baseUrl}/profile/orders`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '10_profile_orders.png') });

            await page.goto(`${baseUrl}/profile/addresses`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '11_profile_addresses.png') });

        } catch (e) {
            console.error('Error on Profile Pages:', e.message);
        }

        await browser.close();
        console.log('Part 2 screenshots captured.');
    } catch (err) {
        console.error('Fatal Error:', err);
    }
})();
