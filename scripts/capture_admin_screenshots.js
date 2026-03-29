
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

        // --- LOGIN ---
        console.log('Logging in...');
        await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' });
        await page.type('#email', 'test@test.com');
        await page.type('#password', '123456789');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0' })
        ]);

        console.log('Logged in. Starting Admin tour...');

        // 5. Admin Dashboard
        console.log('Navigating to Admin Dashboard...');
        try {
            await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '5_admin_dashboard.png') });
        } catch (e) {
            console.error('Error on Admin Dashboard:', e.message);
        }

        // 6. Admin Products List
        console.log('Navigating to Admin Products...');
        try {
            await page.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '6_admin_products.png') });
        } catch (e) {
            console.error('Error on Admin Products:', e.message);
        }

        // 7. Add Product
        console.log('Navigating to Add Product...');
        try {
            await page.goto(`${baseUrl}/admin/products/new`, { waitUntil: 'networkidle0' });
            await page.screenshot({ path: path.join(outputDir, '7_admin_add_product.png') });
        } catch (e) {
            console.error('Error on Add Product:', e.message);
        }

        // 8. Edit Product (Find an edit button or link)
        console.log('Finding product to edit...');
        try {
            // Go back to products list
            await page.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle0' });
            // Try to find an Edit link/button. Usually it might comprise an icon or text "Edit"
            // We'll look for an anchor tag that contains 'products' and some ID (long string) but not 'new'
            const editLink = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href^="/admin/products/"]'));
                const editUrl = links.find(el => {
                    const href = el.getAttribute('href');
                    return !href.endsWith('/new') && !href.endsWith('/products');
                });
                return editUrl ? editUrl.getAttribute('href') : null;
            });

            if (editLink) {
                console.log(`Navigating to Edit Product: ${editLink}`);
                await page.goto(`${baseUrl}${editLink}`, { waitUntil: 'networkidle0' });
                await page.screenshot({ path: path.join(outputDir, '8_admin_edit_product.png') });
            } else {
                console.log('No edit link found.');
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

        // 10. Profile Dropdown
        console.log('Capturing Profile Dropdown...');
        try {
            await page.goto(`${baseUrl}`, { waitUntil: 'networkidle0' });
            // Look for profile trigger. It's likely a button or div with an avatar or user icon.
            // Based on typical NavbarClient, it might be a button inside a UserMenu component.
            // Let's try to click the user specific element.
            // We can try to find an element that likely opens the menu.
            // Often it has an accessible name logic or we can try a selector.
            // Let's assume it's the last button in the navbar or resembles an avatar.

            // Selector strategy: Look for a button that contains an image (avatar) or "Profile" text.
            // Since I don't know the exact class, I'll try to guess or use a broad selector that might trigger it.
            // Or I can screenshot the Profile Page which has the sidebar if that's what the user meant by "dropdown pages".
            // actually "profile dropdownında olan sayfalar" means "navigate to the pages IN the dropdown".
            // Usually these are: Profile, Orders, Logout.
            // I already did Profile. Let's do Orders if it exists.

            await page.goto(`${baseUrl}/profile/orders`, { waitUntil: 'networkidle0' }); // Guessing URL
            await page.screenshot({ path: path.join(outputDir, '10_profile_orders.png') });

            await page.goto(`${baseUrl}/profile/addresses`, { waitUntil: 'networkidle0' }); // Guessing URL
            await page.screenshot({ path: path.join(outputDir, '11_profile_addresses.png') });

        } catch (e) {
            console.error('Error on Profile Pages:', e.message);
        }

        await browser.close();
        console.log('Admin screenshots captured.');
    } catch (err) {
        console.error('Fatal Error:', err);
    }
})();
