
export function appendComplianceFooter(
    originalBody: string,
    contactId: string,
    productId: string,
    physicalAddress: string = "123 Business Rd, Tech City, TC 90210"
): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Fallback for dev
    const unsubscribeUrl = `${baseUrl}/unsubscribe?c=${contactId}&p=${productId}`;
    const privacyUrl = `${baseUrl}/privacy-policy`;

    const footer = `
\n\n
--------------------------------------------------
You received this email because you are a valued contact of TopSalesAgent.
To stop receiving these emails, click here to unsubscribe: ${unsubscribeUrl}

${physicalAddress}
Privacy Policy: ${privacyUrl}
--------------------------------------------------
`;

    return originalBody + footer;
}
