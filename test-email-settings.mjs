// Using built-in fetch (Node 18+)

const PRODUCT_ID = 'topsalesagent';
const BASE_URL = 'http://localhost:3000/api/email';

async function testBackend() {
    console.log('🚀 Testing Email Settings Backend...');

    try {
        // 1. Get Settings
        console.log('\n1. Fetching current settings...');
        const getRes = await fetch(`${BASE_URL}/settings?productId=${PRODUCT_ID}`);
        console.log('GET /settings:', await getRes.json());

        // 2. Update Settings
        console.log('\n2. Updating settings...');
        const postRes = await fetch(`${BASE_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: PRODUCT_ID,
                senderName: 'Test Sender',
                senderEmail: 'support@topsalesagent.ai',
                replyToEmail: 'noreply@topsalesagent.ai',
                sendingMethod: 'platform'
            })
        });
        console.log('POST /settings:', await postRes.json());

        // 3. Generate DKIM
        console.log('\n3. Generating DKIM records...');
        const dkimRes = await fetch(`${BASE_URL}/dkim/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: PRODUCT_ID, domain: 'topsalesagent.ai' })
        });
        console.log('POST /dkim/generate:', await dkimRes.json());

        // 4. Verify DKIM
        console.log('\n4. Verifying DKIM (Mock)...');
        const verifyDkimRes = await fetch(`${BASE_URL}/dkim/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: PRODUCT_ID })
        });
        console.log('POST /dkim/verify:', await verifyDkimRes.json());

        // 5. Check Verification Status
        console.log('\n5. Checking verification status...');
        const verifyStatusRes = await fetch(`${BASE_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: PRODUCT_ID })
        });
        console.log('POST /verify status:', await verifyStatusRes.json());

        console.log('\n✅ Backend tests completed!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
}

testBackend();
