
import { SESClient, GetSendQuotaCommand } from "@aws-sdk/client-ses";
import fs from 'fs';
import path from 'path';

async function verifyCredentials() {
    console.log("🔍 Verifying AWS SES Credentials...");

    // 1. Read DB
    const dbPath = path.join(process.cwd(), 'src/data/db.json');
    if (!fs.existsSync(dbPath)) {
        console.error("❌ DB file not found at:", dbPath);
        return;
    }

    console.log("📂 Reading credentials from src/data/db.json...");
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const product = db.products[0]; // Assuming first product

    if (!product || !product.sesConfig) {
        console.error("❌ No SES config found in DB.");
        return;
    }

    const { accessKeyId, secretAccessKey, region } = product.sesConfig;

    // Trim again just to be sure (simulating what the app does)
    const cleanKey = accessKeyId.trim();
    const cleanSecret = secretAccessKey.trim();
    const cleanRegion = (region || "us-east-1").trim();

    console.log(`🔐 Using Access Key: ${cleanKey} (Length: ${cleanKey.length})`);
    console.log(`🔐 Using Secret Key JSON: ${JSON.stringify(cleanSecret)} (Length: ${cleanSecret.length})`);
    // Print char codes to find hidden chars
    console.log(`🔐 Secret Key Char Codes: ${cleanSecret.split('').map(c => c.charCodeAt(0)).join(', ')}`);

    console.log(`🌍 Using Region: ${cleanRegion}`);

    // 2. Init Client
    const client = new SESClient({
        region: cleanRegion,
        credentials: {
            accessKeyId: cleanKey,
            secretAccessKey: cleanSecret
        }
    });

    // 3. Try a simple command (GetSendQuota is read-only and good for testing auth)
    try {
        const command = new GetSendQuotaCommand({});
        const response = await client.send(command);
        console.log("\n✅ SUCCESS! Credentials are valid.");
        console.log("📊 Check connection info:", response);
    } catch (error) {
        console.error("\n❌ FAILURE! Credentials rejected.");
        console.error("Error Code:", error.name);
        console.error("Error Message:", error.message);

        if (error.name === 'SignatureDoesNotMatch') {
            console.error("\n💡 DIAGNOSIS: The Secret Access Key does NOT match the Access Key ID.");
            console.error("   - Ensure you are not using the 'Console Password'.");
            console.error("   - Ensure you didn't mix up keys from two different users.");
            console.error("   - Try generating a brand new Access Key pair in AWS IAM.");
        }
    }
}

verifyCredentials();
