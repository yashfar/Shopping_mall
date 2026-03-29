
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1024 });

        const baseUrl = 'http://localhost:3000';
        const outputDir = path.join(__dirname, '../public/docs/images');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 1. Home
        console.log('Navigating to Home...');
        try {
            await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.screenshot({ path: path.join(outputDir, '1_home.png') });
        } catch (e) {
            console.error('Error on Home:', e.message);
        }

        // 2. Product
        console.log('Finding product...');
        let productLink = null;
        try {
            productLink = await page.$eval('a[href^="/product/"]', el => el.getAttribute('href'));
        } catch (e) {
            console.log('No product link found via selector a[href^="/product/"]');
        }

        if (productLink) {
            console.log(`Navigating to Product: ${productLink}`);
            try {
                await page.goto(`${baseUrl}${productLink}`, { waitUntil: 'networkidle0', timeout: 30000 });
                await page.screenshot({ path: path.join(outputDir, '2_product.png') });

                // Try to click add to cart? Maybe too complex. Just screenshot.
            } catch (e) {
                console.error('Error on Product:', e.message);
            }
        }

        // 3. Cart
        console.log('Navigating to Cart...');
        try {
            await page.goto(`${baseUrl}/cart`, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.screenshot({ path: path.join(outputDir, '3_cart.png') });
        } catch (e) {
            console.error('Error on Cart:', e.message);
        }

        // 4. Login
        console.log('Navigating to Login...');
        try {
            await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.screenshot({ path: path.join(outputDir, '4_login.png') });
        } catch (e) {
            console.error('Error on Login:', e.message);
        }

        await browser.close();
        console.log('Screenshots captured successfully.');
    } catch (err) {
        console.error('Fatal Error:', err);
    }
})();
