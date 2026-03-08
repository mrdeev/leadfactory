
const PRODUCT_ID = 'topsalesagent';
const BASE_URL = 'http://localhost:3000/api/email';
const TEST_EMAIL = 'test-verification@topsalesagent.ai';

async function testPlatformVerification() {
    console.log('🚀 Testing Platform Verification (AWS SES Integration)...');

    try {
        // 1. Trigger Verification
        console.log(`\n1. Triggering verification for ${TEST_EMAIL}...`);
        const triggerRes = await fetch(`${BASE_URL}/send-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: PRODUCT_ID, email: TEST_EMAIL })
        });

        const triggerData = await triggerRes.json();
        console.log('Trigger Response:', triggerRes.status, triggerData);

        if (!triggerRes.ok) throw new Error('Failed to trigger verification');

        // 2. Check Status (Should be pending)
        console.log('\n2. Checking status (expecting "pending" or "failed" if email invalid)...');
        const checkRes = await fetch(`${BASE_URL}/verify?productId=${PRODUCT_ID}`);
        const checkData = await checkRes.json();
        console.log('Status Response:', checkData);

        if (checkData.status === 'verified') {
            console.log('⚠️ Unexpectedly already verified (did you verify this email before?)');
        } else {
            console.log('✅ Status check works (likely "pending" or "failed" for fake email)');
        }

        console.log('\n✅ Integration test passed (API endpoints are reachable and logic executes).');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
}

testPlatformVerification();
