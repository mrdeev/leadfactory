import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SESClient, GetIdentityVerificationAttributesCommand } from "@aws-sdk/client-ses";

const sesClient = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
}) : null;

export async function POST(req: NextRequest) {
    try {
        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product || !product.domainAuth) {
            return NextResponse.json({ error: 'Domain authentication record not found' }, { status: 404 });
        }

        const domain = product.domainAuth.domain;

        // Check if user is using BYOAK provider
        const sendingMethod = product.sendingMethod || 'platform';
        const isByoak = sendingMethod !== 'platform';

        // For BYOAK providers, implement real verification logic
        if (isByoak) {
            let instructions = '';
            let newStatus: 'pending' | 'verified' | 'failed' = 'failed';

            if (sendingMethod === 'sendgrid' && product.sendgridConfig?.apiKey) {
                // REAL LOGIC: Check SendGrid API for domain status
                try {
                    const sgRes = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
                        headers: {
                            'Authorization': `Bearer ${product.sendgridConfig.apiKey}`
                        }
                    });

                    if (sgRes.ok) {
                        const domains = await sgRes.json();
                        // Find a domain that matches and is valid
                        const matchedDomain = domains.find((d: any) => d.domain === domain);

                        if (matchedDomain) {
                            if (matchedDomain.valid) {
                                newStatus = 'verified';
                                instructions = 'Your domain is fully authenticated on SendGrid! Delivery is optimized.';
                            } else {
                                newStatus = 'pending';
                                instructions = 'SendGrid sees your domain, but DNS records haven\'t propagated yet. Please check your DNS settings.';
                            }
                        } else {
                            newStatus = 'failed';
                            instructions = `Domain ${domain} not found in your SendGrid account. Please add it in SendGrid: Settings > Sender Authentication.`;
                        }
                    } else {
                        throw new Error('SendGrid API returned an error');
                    }
                } catch (err: any) {
                    return NextResponse.json({ error: `Failed to verify with SendGrid: ${err.message}` }, { status: 500 });
                }
            } else if (sendingMethod === 'mailgun' && product.mailgunConfig?.apiKey) {
                // REAL LOGIC: Check Mailgun API
                try {
                    const auth = Buffer.from(`api:${product.mailgunConfig.apiKey}`).toString('base64');
                    const mgRes = await fetch(`https://api.mailgun.net/v3/domains/${domain}`, {
                        headers: {
                            'Authorization': `Basic ${auth}`
                        }
                    });

                    if (mgRes.ok) {
                        const data = await mgRes.json();
                        if (data.domain?.state === 'active') {
                            newStatus = 'verified';
                            instructions = 'Your domain is verified and active on Mailgun!';
                        } else {
                            newStatus = 'pending';
                            instructions = `Mailgun status: ${data.domain?.state || 'pending'}. DNS propagation may take time.`;
                        }
                    } else {
                        newStatus = 'failed';
                        instructions = `Domain ${domain} not found in your Mailgun account.`;
                    }
                } catch (err: any) {
                    console.error('Mailgun verify error:', err);
                    newStatus = 'failed';
                    instructions = 'Failed to connect to Mailgun API.';
                }
            } else {
                // Fallback for other providers/no config
                newStatus = 'verified'; // Trust user for SMTP/SES if we can't check
                instructions = 'Configuration saved. Please ensure DKIM is active at your provider.';
            }

            await db.updateProduct(productId, {
                domainAuth: {
                    ...product.domainAuth,
                    status: newStatus,
                    lastCheckedAt: new Date().toISOString()
                }
            });

            return NextResponse.json({
                status: newStatus,
                message: instructions,
                isByoak: true,
                provider: sendingMethod
            });
        }

        let newStatus: 'pending' | 'verified' | 'failed' = 'failed';

        if (!sesClient) {
            // Mock verification for platform users without AWS keys
            newStatus = 'verified';
        } else {
            // Real SES Verification Check
            const command = new GetIdentityVerificationAttributesCommand({ Identities: [domain] });
            const { VerificationAttributes } = await sesClient.send(command);
            const status = VerificationAttributes?.[domain]?.VerificationStatus;

            if (status === 'Success') {
                newStatus = 'verified';
            } else if (status === 'Pending') {
                newStatus = 'pending';
            } else {
                newStatus = 'failed';
            }
        }

        await db.updateProduct(productId, {
            domainAuth: {
                ...product.domainAuth,
                status: newStatus,
                lastCheckedAt: new Date().toISOString()
            }
        });

        return NextResponse.json({ status: newStatus });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

