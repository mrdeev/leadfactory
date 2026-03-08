const fs = require('fs');
let content = fs.readFileSync('src/lib/action-router.ts', 'utf-8');

// ── LINKEDIN VISIT ─── extension-first ─────────────────────────────────────
const visitOld = [
    "                // ── LINKEDIN VISIT ─────────────────────────────────────",
    "                case 'linkedin_visit': {",
    "                    const liAt = product.linkedinCookie",
    "                    if (!liAt) {",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn cookie configured')",
    "                        return { success: true, skipped: true, reason: 'No LinkedIn cookie' }",
    "                    }",
    "                    const result = await visitLinkedInProfile(contact.linkedinUrl, liAt)",
    "                    updateContact(leadId, { linkedinVisitedAt: new Date().toISOString(), sequenceNodeId: nodeId })",
    "                    logActivity(productId, nodeId, leadId, result.success ? 'done' : 'skipped', result.reason || `Visited ${contact.fullName}'s profile`)",
    "                    return { success: true, skipped: result.skipped, reason: result.reason }",
    "                }",
].join('\n');

const visitNew = [
    "                // ── LINKEDIN VISIT ─────────────────────────────────────",
    "                case 'linkedin_visit': {",
    "                    if (!contact.linkedinUrl) {",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn URL for contact')",
    "                        return { success: true, skipped: true, reason: 'No LinkedIn URL' }",
    "                    }",
    "                    // Extension mode (preferred)",
    "                    if ((product as any).extensionConnected) {",
    "                        createExtensionTask({ type: 'visit', productId, nodeId, leadId, contactName: contact.fullName, profileUrl: contact.linkedinUrl })",
    "                        updateContact(leadId, { sequenceNodeId: nodeId })",
    "                        logActivity(productId, nodeId, leadId, 'queued', `[Extension] Visit queued for ${contact.fullName}`)",
    "                        return { success: true }",
    "                    }",
    "                    // Apify fallback",
    "                    const liAtVisit = product.linkedinCookie",
    "                    if (!liAtVisit) {",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn cookie configured')",
    "                        return { success: true, skipped: true, reason: 'No LinkedIn cookie' }",
    "                    }",
    "                    const visitResult = await visitLinkedInProfile(contact.linkedinUrl, liAtVisit)",
    "                    updateContact(leadId, { linkedinVisitedAt: new Date().toISOString(), sequenceNodeId: nodeId })",
    "                    logActivity(productId, nodeId, leadId, visitResult.success ? 'done' : 'skipped', visitResult.reason || `Visited ${contact.fullName}'s profile`)",
    "                    return { success: true, skipped: visitResult.skipped, reason: visitResult.reason }",
    "                }",
].join('\n');

if (content.includes(visitOld)) {
    content = content.replace(visitOld, visitNew);
    console.log('✅ Replaced linkedin_visit case');
} else {
    console.log('❌ Could not find linkedin_visit case');
}

// ── LINKEDIN INVITE ─── extension-first ────────────────────────────────────
const inviteOld = [
    "                // ── LINKEDIN INVITE ────────────────────────────────────",
    "                case 'linkedin_invite': {",
    "                    const liAt = product.linkedinCookie",
    "                    if (!liAt) {",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn cookie configured')",
    "                        return { success: true, skipped: true, reason: 'No LinkedIn cookie' }",
    "                    }",
    "                    const result = await sendLinkedInInvite(contact.linkedinUrl, liAt)",
    "                    updateContact(leadId, { linkedinInviteSentAt: new Date().toISOString(), sequenceNodeId: nodeId })",
    "                    logActivity(productId, nodeId, leadId, result.success ? 'done' : 'skipped', result.reason || `Sent invite to ${contact.fullName}`)",
    "                    return { success: true, skipped: result.skipped, reason: result.reason }",
    "                }",
].join('\n');

const inviteNew = [
    "                // ── LINKEDIN INVITE ────────────────────────────────────",
    "                case 'linkedin_invite': {",
    "                    if (!contact.linkedinUrl) {",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn URL for contact')",
    "                        return { success: true, skipped: true, reason: 'No LinkedIn URL' }",
    "                    }",
    "                    // Extension mode (preferred)",
    "                    if ((product as any).extensionConnected) {",
    "                        createExtensionTask({ type: 'invite', productId, nodeId, leadId, contactName: contact.fullName, profileUrl: contact.linkedinUrl })",
    "                        updateContact(leadId, { sequenceNodeId: nodeId })",
    "                        logActivity(productId, nodeId, leadId, 'queued', `[Extension] Invite queued for ${contact.fullName}`)",
    "                        return { success: true }",
    "                    }",
    "                    // Apify fallback",
    "                    const liAtInvite = product.linkedinCookie",
    "                    if (!liAtInvite) {",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn cookie configured')",
    "                        return { success: true, skipped: true, reason: 'No LinkedIn cookie' }",
    "                    }",
    "                    const inviteResult = await sendLinkedInInvite(contact.linkedinUrl, liAtInvite)",
    "                    updateContact(leadId, { linkedinInviteSentAt: new Date().toISOString(), sequenceNodeId: nodeId })",
    "                    logActivity(productId, nodeId, leadId, inviteResult.success ? 'done' : 'skipped', inviteResult.reason || `Sent invite to ${contact.fullName}`)",
    "                    return { success: true, skipped: inviteResult.skipped, reason: inviteResult.reason }",
    "                }",
].join('\n');

if (content.includes(inviteOld)) {
    content = content.replace(inviteOld, inviteNew);
    console.log('✅ Replaced linkedin_invite case');
} else {
    console.log('❌ Could not find linkedin_invite case');
}

// ── CONDITION ─── extension-first ─────────────────────────────────────────
const condOld = [
    "                // ── CONDITION (check LinkedIn acceptance) ──────────────",
    "                case 'condition': {",
    "                    const liAt = product.linkedinCookie",
    "                    if (!liAt) {",
    "                        // No cookie → treat as not-connected → NO branch",
    "                        updateContact(leadId, { linkedinConnected: false, linkedinConnectionCheckedAt: new Date().toISOString() })",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn cookie — routing to NO branch')",
    "                        return { success: true, linkedinConnected: false, skipped: true }",
    "                    }",
    "                    const { connected, skipped, reason } = await checkLinkedInAcceptance(contact.linkedinUrl, liAt)",
    "                    updateContact(leadId, { linkedinConnected: connected, linkedinConnectionCheckedAt: new Date().toISOString() })",
    "                    logActivity(productId, nodeId, leadId, 'done', `Connection check for ${contact.fullName}: ${connected ? 'ACCEPTED (YES)' : 'PENDING (NO)'}`)",
    "                    return { success: true, linkedinConnected: connected, skipped, reason }",
    "                }",
].join('\n');

const condNew = [
    "                // ── CONDITION (check LinkedIn acceptance) ──────────────",
    "                case 'condition': {",
    "                    if (contact.linkedinUrl && (product as any).extensionConnected) {",
    "                        // Extension mode: queue check; /complete route routes correct branch",
    "                        createExtensionTask({ type: 'check_acceptance', productId, nodeId, leadId, contactName: contact.fullName, profileUrl: contact.linkedinUrl })",
    "                        updateContact(leadId, { sequenceNodeId: nodeId })",
    "                        logActivity(productId, nodeId, leadId, 'queued', `[Extension] Acceptance check queued for ${contact.fullName}`)",
    "                        return { success: true, linkedinConnected: false, skipped: true }",
    "                    }",
    "                    // Apify fallback",
    "                    const liAtCond = product.linkedinCookie",
    "                    if (!liAtCond) {",
    "                        updateContact(leadId, { linkedinConnected: false, linkedinConnectionCheckedAt: new Date().toISOString() })",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn cookie — routing to NO branch')",
    "                        return { success: true, linkedinConnected: false, skipped: true }",
    "                    }",
    "                    const { connected, skipped, reason } = await checkLinkedInAcceptance(contact.linkedinUrl, liAtCond)",
    "                    updateContact(leadId, { linkedinConnected: connected, linkedinConnectionCheckedAt: new Date().toISOString() })",
    "                    logActivity(productId, nodeId, leadId, 'done', `Connection check for ${contact.fullName}: ${connected ? 'ACCEPTED (YES)' : 'PENDING (NO)'}`)",
    "                    return { success: true, linkedinConnected: connected, skipped, reason }",
    "                }",
].join('\n');

if (content.includes(condOld)) {
    content = content.replace(condOld, condNew);
    console.log('✅ Replaced condition case');
} else {
    console.log('❌ Could not find condition case');
}

// ── LINKEDIN CHAT ─── extension-first ─────────────────────────────────────
const chatOld = [
    "                // ── LINKEDIN CHAT ──────────────────────────────────────",
    "                case 'linkedin_chat': {",
    "                    const liAt = product.linkedinCookie",
    "                    if (!liAt) {",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn cookie configured')",
    "                        return { success: true, skipped: true, reason: 'No LinkedIn cookie' }",
    "                    }",
    "                    const firstName = contact.firstName || contact.fullName?.split(' ')[0] || 'there'",
    "                    const chatMsg = nodeId === 'chat_yes1'",
    "                        ? `Hi ${firstName}, thanks for connecting! I noticed your work at ${contact.orgName || 'your company'} and wanted to reach out personally. Would love to hear more about what you're working on.`",
    "                        : `Hi ${firstName}, just following up on my previous message. Still keen to connect if the timing is right — no pressure at all.`",
    "",
    "                    const result = await sendLinkedInMessage(contact.linkedinUrl, liAt, chatMsg)",
    "                    updateContact(leadId, { linkedinChatSentAt: new Date().toISOString(), sequenceNodeId: nodeId })",
    "                    logActivity(productId, nodeId, leadId, result.success ? 'done' : 'skipped', result.reason || `Chat sent to ${contact.fullName}`)",
    "                    return { success: true, skipped: result.skipped, reason: result.reason }",
    "                }",
].join('\n');

const chatNew = [
    "                // ── LINKEDIN CHAT ──────────────────────────────────────",
    "                case 'linkedin_chat': {",
    "                    if (!contact.linkedinUrl) {",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn URL for contact')",
    "                        return { success: true, skipped: true, reason: 'No LinkedIn URL' }",
    "                    }",
    "                    const firstName = contact.firstName || contact.fullName?.split(' ')[0] || 'there'",
    "                    const chatMsg = nodeId === 'chat_yes1'",
    "                        ? `Hi ${firstName}, thanks for connecting! I noticed your work at ${contact.orgName || 'your company'} and wanted to reach out personally. Would love to hear more about what you're working on.`",
    "                        : `Hi ${firstName}, just following up on my previous message. Still keen to connect if the timing is right — no pressure at all.`",
    "",
    "                    // Extension mode (preferred)",
    "                    if ((product as any).extensionConnected) {",
    "                        createExtensionTask({ type: 'message', productId, nodeId, leadId, contactName: contact.fullName, profileUrl: contact.linkedinUrl, messageText: chatMsg })",
    "                        updateContact(leadId, { sequenceNodeId: nodeId })",
    "                        logActivity(productId, nodeId, leadId, 'queued', `[Extension] Message queued for ${contact.fullName}`)",
    "                        return { success: true }",
    "                    }",
    "                    // Apify fallback",
    "                    const liAtChat = product.linkedinCookie",
    "                    if (!liAtChat) {",
    "                        logActivity(productId, nodeId, leadId, 'skipped', 'No LinkedIn cookie configured')",
    "                        return { success: true, skipped: true, reason: 'No LinkedIn cookie' }",
    "                    }",
    "                    const chatResult = await sendLinkedInMessage(contact.linkedinUrl, liAtChat, chatMsg)",
    "                    updateContact(leadId, { linkedinChatSentAt: new Date().toISOString(), sequenceNodeId: nodeId })",
    "                    logActivity(productId, nodeId, leadId, chatResult.success ? 'done' : 'skipped', chatResult.reason || `Chat sent to ${contact.fullName}`)",
    "                    return { success: true, skipped: chatResult.skipped, reason: chatResult.reason }",
    "                }",
].join('\n');

if (content.includes(chatOld)) {
    content = content.replace(chatOld, chatNew);
    console.log('✅ Replaced linkedin_chat case');
} else {
    console.log('❌ Could not find linkedin_chat case');
}

fs.writeFileSync('src/lib/action-router.ts', content);
console.log('Final line count:', content.split('\n').length);
