import { db } from '@/lib/db'

export function getUnipileConfig() {
    const apiUrl = process.env.UNIPILE_API_URL
    const accessToken = process.env.UNIPILE_ACCESS_TOKEN

    if (!apiUrl || !accessToken) {
        throw new Error('Unipile API configuration is missing in environment variables')
    }

    return { apiUrl, accessToken }
}

export async function unipileFetch(path: string, options: RequestInit = {}) {
    const { apiUrl, accessToken } = getUnipileConfig()

    const res = await fetch(`${apiUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': accessToken,
            ...options.headers,
        },
    })

    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Unipile ${options.method || 'GET'} ${path} failed (${res.status}): ${body}`)
    }

    return res.json()
}

export function extractLinkedInIdentifier(url: string): string | null {
    if (!url) return null;
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] === 'in' && parts[1]) {
            return parts[1];
        }
        return null;
    } catch {
        const match = url.match(/linkedin\.com\/in\/([^/?]+)/i);
        return match ? match[1] : null;
    }
}

export async function getUnipileProviderId(linkedinUrl: string, accountId: string): Promise<string> {
    const identifier = extractLinkedInIdentifier(linkedinUrl);
    if (!identifier) throw new Error(`Could not extract LinkedIn identifier from URL: ${linkedinUrl}`);

    const data = await unipileFetch(`/api/v1/users/${identifier}?account_id=${accountId}`);
    if (!data.provider_id) {
        throw new Error(`Unipile did not return provider_id for user: ${identifier}`);
    }
    return data.provider_id;
}

export async function getUnipileProfile(providerId: string, accountId: string) {
    const data = await unipileFetch(`/api/v1/users/${providerId}?account_id=${accountId}`);
    return data;
}

export async function sendUnipileInvite(providerId: string, accountId: string, message?: string) {
    const payload: any = {
        provider_id: providerId,
        account_id: accountId
    };
    if (message && message.trim().length > 0) {
        payload.message = message;
    }

    const data = await unipileFetch('/api/v1/users/invite', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return data;
}

export async function sendUnipileMessage(providerId: string, accountId: string, message: string) {
    const payload = {
        account_id: accountId,
        attendees_ids: [providerId],
        text: message
    };

    const data = await unipileFetch('/api/v1/chats', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return data;
}

export async function checkUnipileConnection(providerId: string, accountId: string): Promise<boolean> {
    const profile = await getUnipileProfile(providerId, accountId);
    return profile.network_distance === 1;
}
