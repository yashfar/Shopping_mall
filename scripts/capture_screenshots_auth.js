
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1024']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1024 });

        const baseUrl = 'http://localhost:3000';
        const outputDir = path.join(__dirname, '../public/docs/images');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 0. Login first
        console.log('Navigating to Login for authentication...');
        await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30000 });

        console.log('Filling login form...');
        await page.type('#email', 'test@test.com');
        await page.type('#password', '123456789');

        console.log('Submitting login...');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log('Navigation timeout or already handled', e.message))
        ]);

        console.log('Login attempt finished. Proceeding to screenshots...');

        // 1. Home (Authenticated)
        console.log('Navigating to Home...');
        try {
            await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.screenshot({ path: path.join(outputDir, '1_home_auth.png') });
        } catch (e) {
            console.error('Error on Home:', e.message);
        }

        // 2. Product
        console.log('Finding product...');
        let productLink = null;
        try {
            productLink = await page.$eval('a[href^="/product/"]', el => el.getAttribute('href'));
        } catch (e) {
            console.log('No product link found, trying to find any product card...');
        }

        if (productLink) {
            console.log(`Navigating to Product: ${productLink}`);
            try {
                await page.goto(`${baseUrl}${productLink}`, { waitUntil: 'networkidle0', timeout: 30000 });
                await page.screenshot({ path: path.join(outputDir, '2_product_auth.png') });

                // Optional: Try adding to cart to populate it?
                // But let's just screenshot the pages for now.
            } catch (e) {
                console.error('Error on Product:', e.message);
            }
        }

        // 3. Cart
        console.log('Navigating to Cart...');
        try {
            await page.goto(`${baseUrl}/cart`, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.screenshot({ path: path.join(outputDir, '3_cart_auth.png') });
        } catch (e) {
            console.error('Error on Cart:', e.message);
        }

        // 4. Profile
        console.log('Navigating to Profile...');
        try {
            await page.goto(`${baseUrl}/profile`, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.screenshot({ path: path.join(outputDir, '4_profile_auth.png') });
        } catch (e) {
            console.error('Error on Profile:', e.message);
        }

        await browser.close();
        console.log('Authenticated screenshots captured successfully.');
    } catch (err) {
        console.error('Fatal Error:', err);
    }
})();
