import { db } from './src/lib/db';
import { airtopSendInvite } from './src/lib/airtop-linkedin';

async function test() {
    console.log('Fetching products...');
    const products = await db.getProducts();
    const product = products.find(p => p.linkedinCookie);

    if (!product) {
        console.error('No product found with a linkedinCookie.');
        process.exit(1);
    }

    console.log(`Using product: ${product.name} (ID: ${product.id})`);
    // Pass 'FR' explicitly as the proxy country for testing
    const proxyCountry = 'FR'
    console.log(`Proxy Country: ${proxyCountry}`)

    const targetUrl = 'https://www.linkedin.com/in/merwane-kehy/?originalSubdomain=fr'
    const note = 'Hi Merwane, testing our LinkedIn automation sequence through Lead Factory. Best, Noor'

    console.log(`Sending invite to: ${targetUrl}`)
    console.log(`Note: ${note}`)

    const profileName = `linkedin-${product.id}`
    try {
        const result = await airtopSendInvite(
            targetUrl,
            profileName,
            note,
            product.linkedinCookie as string,
            proxyCountry
        );

        console.log('Result:', result);
    } catch (err) {
        console.error('Test failed with error:', err);
    }
}

test();
