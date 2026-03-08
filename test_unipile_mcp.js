import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
    console.log("Connecting to Unipile MCP...");
    const url = new URL("https://developer.unipile.com/mcp");
    const transport = new SSEClientTransport(url, {
        headers: {
            "X-API-KEY": "JqRAyVtH.9Sg+NZfM/t2kThgp0+76fBKfuJnYetDyIGcCIAWImJM="
        }
    });
    const client = new Client(
        { name: "test-client", version: "1.0.0" },
        { capabilities: {} }
    );
    await client.connect(transport);
    console.log("Connected! Fetching tools...");
    
    const tools = await client.listTools();
    console.log("Tools available:", JSON.stringify(tools, null, 2));
    
    process.exit(0);
}

main().catch(console.error);
