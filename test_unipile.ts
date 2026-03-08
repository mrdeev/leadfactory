import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    const apiUrl = process.env.UNIPILE_API_URL;
    const accessToken = process.env.UNIPILE_ACCESS_TOKEN;

    if (!apiUrl || !accessToken) {
        console.error('Missing Unipile config');
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/api/v1/accounts`, {
            headers: {
                'X-API-KEY': accessToken,
            }
        });
        const data = await response.json();
        console.log(JSON.stringify(data.slice(0, 3), null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
