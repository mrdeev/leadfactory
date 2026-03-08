// No import needed for fetch in Node 24

async function test() {
    console.log('--- Starting Sequence Execution Test ---');

    const baseUrl = 'http://localhost:3000';
    const productId = 'topsalesagent';

    console.log('0. Clearing existing jobs...');
    // We can't easily clear via API without an endpoint, so we'll just hope the runner purges them or we rely on the next run.
    // Actually, let's just trigger the runner and see what happens.

    console.log('1. Triggering manual runner for productId:', productId);
    try {
        const runnerRes = await fetch(`${baseUrl}/api/sequence/runner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });
        const runnerData = await runnerRes.json();
        console.log('Runner response:', runnerData);

        if (runnerData.enqueued > 0) {
            console.log(`Successfully enqueued ${runnerData.enqueued} jobs.`);
        } else {
            console.log('No jobs enqueued. This might be because leads are not due or campaign is paused.');
        }

        // Wait a bit for the worker to process (since it's fire-and-forget but chained)
        console.log('Waiting 5 seconds for worker to process...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('2. Checking sequence states...');
        const statesRes = await fetch(`${baseUrl}/api/sequence/runner?productId=${productId}`);
        const statesData = await statesRes.json();
        console.log('States summary:', statesData.states.map(s => ({
            leadId: s.leadId,
            nodeId: s.sequenceNodeId,
            status: s.status,
            pendingJob: s.pendingJob ? 'YES' : 'NO'
        })));

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

test();
