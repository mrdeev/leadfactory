
import { SESClient, SendEmailCommand, GetIdentityVerificationAttributesCommand, ListIdentitiesCommand } from "@aws-sdk/client-ses";

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
const AWS_REGION = "eu-north-1";

const client = new SESClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    }
});

async function diagnose() {
    console.log("🔍 Starting SES Diagnosis...\n");

    const sender = "support@topsalesagent.ai";
    const recipient = "nmjibon2022@gmail.com";

    // 1. Check Identity Status
    console.log(`Step 1: Checking status for ${sender}...`);
    try {
        const statusCmd = new GetIdentityVerificationAttributesCommand({ Identities: [sender] });
        const statusRes = await client.send(statusCmd);
        const status = statusRes.VerificationAttributes?.[sender]?.VerificationStatus;
        console.log(`Result: ${status || 'NOT FOUND'}`);

        if (status !== 'Success') {
            console.log(`❌ ERROR: ${sender} is NOT a verified identity in SES.`);
        }
    } catch (err) {
        console.error("❌ Failed to fetch identity status:", err.message);
    }

    // 2. Try Sending Test Email
    console.log(`\nStep 2: Attempting to send test email to ${recipient}...`);
    try {
        const sendCmd = new SendEmailCommand({
            Source: sender,
            Destination: { ToAddresses: [recipient] },
            Message: {
                Subject: { Data: "SES Test Diagnosis" },
                Body: { Text: { Data: "This is a test from Antigravity to diagnose your SES connection." } }
            }
        });
        const sendRes = await client.send(sendCmd);
        console.log("✅ SUCCESS! Message ID:", sendRes.MessageId);
    } catch (err) {
        console.error("\n❌ SEND FAILURE!");
        console.error("Error Name:", err.name);
        console.error("Error Message:", err.message);

        if (err.message.includes("Email address is not verified")) {
            console.log("\n💡 DIAGNOSIS: SES is in Sandbox mode or the identity is unverified.");
            console.log("   In Sandbox, BOTH sender and recipient must be verified in the AWS Console.");
        }
    }

    // 3. List ALL Verified Identities
    console.log(`\nStep 3: Checking for ANY verified identities...`);
    try {
        const listCmd = new ListIdentitiesCommand({ IdentityType: "EmailAddress" });
        const listRes = await client.send(listCmd);
        console.log("Verified Emails:", listRes.Identities);

        const listDomainsCmd = new ListIdentitiesCommand({ IdentityType: "Domain" });
        const listDomainsRes = await client.send(listDomainsCmd);
        console.log("Verified Domains:", listDomainsRes.Identities);

    } catch (err) {
        console.error("Failed to list identities:", err.message);
    }
}

diagnose();
