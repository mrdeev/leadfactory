import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SESClient, VerifyDomainIdentityCommand, VerifyDomainDkimCommand } from "@aws-sdk/client-ses";

const sesClient = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
}) : null;

export async function POST(req: NextRequest) {
    try {
        const { productId, domain } = await req.json();

        if (!productId || !domain) {
            return NextResponse.json({ error: 'Product ID and domain are required' }, { status: 400 });
        }

        const product = await db.getProduct(productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Sanitize domain (in case user entered an email)
        const sanitizedDomain = domain.includes('@') ? domain.split('@')[1] : domain;

        // Check if user is using BYOAK provider
        const sendingMethod = product.sendingMethod || 'platform';
        const isByoak = sendingMethod !== 'platform';

        // For BYOAK providers, try to fetch real records from their API
        if (isByoak) {
            let instructions = '';
            let dkimRecords: { name: string, type: string, value: string }[] = [];

            if (sendingMethod === 'sendgrid' && product.sendgridConfig?.apiKey) {
                try {
                    const sgRes = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
                        headers: { 'Authorization': `Bearer ${product.sendgridConfig.apiKey}` }
                    });
                    if (sgRes.ok) {
                        const domains = await sgRes.json();
                        const matched = domains.find((d: any) => d.domain === sanitizedDomain);
                        if (matched && matched.dns) {
                            dkimRecords = [
                                { name: matched.dns.dkim1.host, type: 'CNAME', value: matched.dns.dkim1.data },
                                { name: matched.dns.dkim2.host, type: 'CNAME', value: matched.dns.dkim2.data },
                                { name: matched.dns.mail_cname.host, type: 'CNAME', value: matched.dns.mail_cname.data }
                            ];
                            instructions = 'Records fetched from SendGrid. Please ensure these match your DNS settings.';
                        } else {
                            instructions = `Domain ${sanitizedDomain} not found in SendGrid. Please add it first in: Settings > Sender Authentication > Domain Authentication.`;
                            dkimRecords = [
                                { name: `em._domainkey.${sanitizedDomain}`, type: 'CNAME', value: 'Add domain in SendGrid first' },
                                { name: `s1._domainkey.${sanitizedDomain}`, type: 'CNAME', value: 'Add domain in SendGrid first' },
                                { name: `s2._domainkey.${sanitizedDomain}`, type: 'CNAME', value: 'Add domain in SendGrid first' },
                            ];
                        }
                    }
                } catch (e) {
                    console.error('SendGrid fetch error:', e);
                }
            } else if (sendingMethod === 'mailgun' && product.mailgunConfig?.apiKey) {
                try {
                    const auth = Buffer.from(`api:${product.mailgunConfig.apiKey}`).toString('base64');
                    const mgRes = await fetch(`https://api.mailgun.net/v3/domains/${sanitizedDomain}`, {
                        headers: { 'Authorization': `Basic ${auth}` }
                    });
                    if (mgRes.ok) {
                        const data = await mgRes.json();
                        if (data.sending_dns_records) {
                            dkimRecords = data.sending_dns_records.map((r: any) => ({
                                name: r.name,
                                type: r.record_type,
                                value: r.value
                            }));
                            instructions = 'Records fetched from Mailgun.';
                        }
                    }
                } catch (e) {
                    console.error('Mailgun fetch error:', e);
                }
            }

            // Fallback if no records found or other provider
            if (dkimRecords.length === 0) {
                switch (sendingMethod) {
                    case 'sendgrid':
                        instructions = instructions || 'Please set up domain authentication in your SendGrid dashboard: Settings > Sender Authentication';
                        dkimRecords = [
                            { name: `em._domainkey.${sanitizedDomain}`, type: 'CNAME', value: 'Configure in SendGrid' },
                            { name: `s1._domainkey.${sanitizedDomain}`, type: 'CNAME', value: 'Configure in SendGrid' },
                            { name: `s2._domainkey.${sanitizedDomain}`, type: 'CNAME', value: 'Configure in SendGrid' },
                        ];
                        break;
                    case 'mailgun':
                        instructions = instructions || 'Please set up domain verification in your Mailgun dashboard.';
                        dkimRecords = [{ name: `mg._domainkey.${sanitizedDomain}`, type: 'TXT', value: 'Configure in Mailgun' }];
                        break;
                    case 'ses':
                    case 'smtp':
                    default:
                        instructions = `Please configure DKIM through your ${sendingMethod} provider's dashboard.`;
                        dkimRecords = [{ name: `default._domainkey.${sanitizedDomain}`, type: 'TXT', value: 'Check your provider' }];
                }
            }

            await db.updateProduct(productId, {
                domainAuth: {
                    domain: sanitizedDomain,
                    dkimRecords,
                    instructions,
                    status: 'pending',
                    lastCheckedAt: new Date().toISOString()
                }
            });

            return NextResponse.json({
                dkimRecords,
                instructions,
                isByoak: true,
                provider: sendingMethod
            });
        }

        // For Platform (Resend/SES) users, use AWS SES or fallback to mock
        if (!sesClient) {
            // Fallback to Resend-style mock records if no AWS keys
            const dkimRecords = [
                { name: `resend._domainkey.${domain}`, type: 'TXT', value: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3...` },
                { name: `_rs.${domain}`, type: 'TXT', value: `v=spf1 include:spf.resend.com ~all` }
            ];

            await db.updateProduct(productId, {
                domainAuth: {
                    domain,
                    dkimRecords,
                    status: 'pending',
                    lastCheckedAt: new Date().toISOString()
                }
            });

            return NextResponse.json({ dkimRecords });
        }

        // Real AWS SES DKIM generation
        const idCommand = new VerifyDomainIdentityCommand({ Domain: domain });
        const idData = await sesClient.send(idCommand);
        const verificationToken = idData.VerificationToken || '';

        const dkimCommand = new VerifyDomainDkimCommand({ Domain: domain });
        const dkimData = await sesClient.send(dkimCommand);
        const dkimTokens = dkimData.DkimTokens || [];

        const dkimRecords: { name: string, type: string, value: string }[] = [
            { name: `_amazonses.${domain}`, type: 'TXT', value: verificationToken },
            ...dkimTokens.map(token => ({
                name: `${token}._domainkey.${domain}`,
                type: 'CNAME',
                value: `${token}.dkim.amazonses.com`
            })),
            { name: domain, type: 'TXT', value: 'v=spf1 include:amazonses.com ~all' }
        ];

        await db.updateProduct(productId, {
            domainAuth: {
                domain,
                dkimRecords,
                status: 'pending',
                lastCheckedAt: new Date().toISOString()
            }
        });

        return NextResponse.json({ dkimRecords });
    } catch (error: any) {
        console.error('Failed to generate DKIM:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

