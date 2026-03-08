import { SESClient, SendEmailCommand, VerifyEmailIdentityCommand, GetIdentityVerificationAttributesCommand } from "@aws-sdk/client-ses";
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

// Initialize Global SES Client (Platform default)
// We use safe trimming here to avoid "SignatureDoesNotMatch" errors
export const globalSesClient = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? new SESClient({
    region: (process.env.AWS_REGION || 'us-east-1').trim(),
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
    }
}) : null;

interface SendEmailParams {
    to: string;
    from: string;
    subject: string;
    text?: string;
    html?: string;
    replyTo?: string;
    // Multi-provider config
    provider?: 'platform' | 'ses' | 'sendgrid' | 'mailgun' | 'smtp';
    smtpConfig?: {
        host: string;
        port: number;
        user: string;
        pass: string;
    };
    sesConfig?: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
    };
    sendgridConfig?: {
        apiKey: string;
    };
    mailgunConfig?: {
        apiKey: string;
        domain: string;
        region?: 'us' | 'eu';
    };
}

export async function sendEmail(params: SendEmailParams) {
    const { to, from, subject, text, html, replyTo, provider = 'platform', smtpConfig, sesConfig, sendgridConfig, mailgunConfig } = params;

    console.log(`[Email] Attempting to send via provider: ${provider}`);

    // ======================================
    // BYOAK PROVIDERS
    // ======================================

    // 1. SendGrid (BYOAK)
    if (provider === 'sendgrid') {
        if (!sendgridConfig?.apiKey) {
            throw new Error('SendGrid API key is required');
        }
        console.log('[Email] Using SendGrid');
        sgMail.setApiKey(sendgridConfig.apiKey);
        return await sgMail.send({
            to,
            from,
            subject,
            text: text || '',
            html: html || '',
            replyTo,
        });
    }

    // 2. Mailgun (BYOAK)
    if (provider === 'mailgun') {
        if (!mailgunConfig?.apiKey || !mailgunConfig?.domain) {
            throw new Error('Mailgun API key and domain are required');
        }

        if (mailgunConfig.domain.startsWith('http')) {
            throw new Error('Invalid Mailgun domain. Provide your sending domain (e.g., mg.yourdomain.com), NOT the API URL.');
        }

        console.log('[Email] Using Mailgun');
        const mailgun = new Mailgun(FormData);
        const mg = mailgun.client({
            username: 'api',
            key: mailgunConfig.apiKey,
            url: mailgunConfig.region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
        });

        const data: any = {
            from,
            to: [to],
            subject,
            text,
            html,
            "h:Reply-To": replyTo
        };
        return await mg.messages.create(mailgunConfig.domain, data);
    }

    // 3. Amazon SES (BYOAK - User's own AWS credentials)
    if (provider === 'ses') {
        if (!sesConfig?.accessKeyId || !sesConfig?.secretAccessKey) {
            throw new Error('AWS SES Access Key ID and Secret Access Key are required');
        }

        const accessKeyId = sesConfig.accessKeyId.trim();
        const secretAccessKey = sesConfig.secretAccessKey.trim();
        const region = (sesConfig.region || 'us-east-1').trim();

        console.log(`[Email] Using User SES in region: ${region} (Key: ${accessKeyId.substring(0, 4)}...)`);

        const client = new SESClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            }
        });

        const command = new SendEmailCommand({
            Source: from,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject },
                Body: {
                    ...(html ? { Html: { Data: html } } : {}),
                    ...(text ? { Text: { Data: text } } : {}),
                },
            },
            ReplyToAddresses: replyTo ? [replyTo] : [],
        });

        try {
            return await client.send(command);
        } catch (error: any) {
            console.error('[Email] SES Send Error Details:', {
                code: error.name,
                message: error.message,
                requestId: error.$metadata?.requestId,
                region: region,
                keyLen: accessKeyId.length
            });

            let errorMessage = error.message;

            // Check for common Sandbox mode error: "Email address is not verified"
            if (errorMessage.includes('Email address is not verified') && !errorMessage.includes(from)) {
                errorMessage += " (TIP: Your AWS SES account might be in Sandbox Mode. In this mode, BOTH the sender and the recipient address must be verified. Visit your AWS Console to verify the recipient or request Production Access.)";
            }

            throw new Error(`AWS SES Error: ${errorMessage} (Region: ${region}, KeyLen: ${accessKeyId.length})`);
        }
    }

    // 4. Custom SMTP (BYOAK)
    if (provider === 'smtp') {
        if (!smtpConfig?.host || !smtpConfig?.user) {
            throw new Error('SMTP host and username are required');
        }
        console.log('[Email] Using Custom SMTP');
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.port === 465,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
            },
        });
        return await transporter.sendMail({ from, to, subject, text, html, replyTo });
    }

    // ======================================
    // PLATFORM (DEFAULT) - Use Global AWS SES
    // ======================================

    if (provider === 'platform') {
        if (!globalSesClient) {
            throw new Error('Platform email is not configured (Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY in env)');
        }

        console.log('[Email] Using Platform SES (Global Client)');

        const command = new SendEmailCommand({
            Source: from,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject },
                Body: {
                    ...(html ? { Html: { Data: html } } : {}),
                    ...(text ? { Text: { Data: text } } : {}),
                },
            },
            ReplyToAddresses: replyTo ? [replyTo] : [],
        });

        return await globalSesClient.send(command);
    }

    throw new Error(`Email provider '${provider}' is not correctly configured. Please check your settings.`);
}

// Helper to trigger AWS Verification Email
export async function verifyEmailIdentity(email: string) {
    if (!globalSesClient) {
        throw new Error('Platform email is not configured (Missing AWS_ACCESS_KEY_ID in env)');
    }
    const command = new VerifyEmailIdentityCommand({ EmailAddress: email });
    return await globalSesClient.send(command);
}

// Helper to check verification status
export async function checkIdentityStatus(email: string) {
    if (!globalSesClient) {
        throw new Error('Platform email is not configured');
    }
    const command = new GetIdentityVerificationAttributesCommand({ Identities: [email] });
    const response = await globalSesClient.send(command);
    return response.VerificationAttributes?.[email]?.VerificationStatus; // 'Success' | 'Pending' | 'Failed'
}
