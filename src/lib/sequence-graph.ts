// Hardcoded sequence graph — matches the UI node editor exactly.
// Each node defines its type, how long to wait BEFORE executing it,
// and where to route after execution.

export type SequenceNodeType =
    | 'email'
    | 'linkedin_visit'
    | 'linkedin_invite'
    | 'condition'
    | 'linkedin_chat'
    | 'end'

export interface SequenceNode {
    id: string
    type: SequenceNodeType
    label: string
    // Days to wait after the PREVIOUS node completes before this one fires
    waitBeforeDays: number
    // Where to go after successful execution (simple linear nodes)
    nextNodeId?: string
    // Condition nodes route to one of two branches
    yesNodeId?: string
    noNodeId?: string
}

// The full multi-channel sequence graph matching the UI
export const DEFAULT_SEQUENCE: SequenceNode[] = [
    {
        id: 'email1',
        type: 'email',
        label: 'Email — Opening touch',
        waitBeforeDays: 0,
        nextNodeId: 'visit',
    },
    {
        id: 'visit',
        type: 'linkedin_visit',
        label: 'Visit profile',
        waitBeforeDays: 1,
        nextNodeId: 'invite',
    },
    {
        id: 'invite',
        type: 'linkedin_invite',
        label: 'Invitation',
        waitBeforeDays: 1,
        nextNodeId: 'condition',
    },
    {
        id: 'condition',
        type: 'condition',
        label: 'Accepted invite within 5 days',
        waitBeforeDays: 5,
        yesNodeId: 'chat_yes1',
        noNodeId: 'email_no1',
    },
    // ── YES branch ──────────────────────────────────────────────────────
    {
        id: 'chat_yes1',
        type: 'linkedin_chat',
        label: 'Chat message (YES-1)',
        waitBeforeDays: 1,
        nextNodeId: 'email_yes',
    },
    {
        id: 'email_yes',
        type: 'email',
        label: 'Email (YES follow-up)',
        waitBeforeDays: 1,
        nextNodeId: 'chat_yes2',
    },
    {
        id: 'chat_yes2',
        type: 'linkedin_chat',
        label: 'Chat message (YES-2)',
        waitBeforeDays: 3,
        nextNodeId: 'end',
    },
    // ── NO branch ───────────────────────────────────────────────────────
    {
        id: 'email_no1',
        type: 'email',
        label: 'Email (NO follow-up 1)',
        waitBeforeDays: 1,
        nextNodeId: 'email_no2',
    },
    {
        id: 'email_no2',
        type: 'email',
        label: 'Email (NO follow-up 2)',
        waitBeforeDays: 1,
        nextNodeId: 'email_no3',
    },
    {
        id: 'email_no3',
        type: 'email',
        label: 'Email (NO breakup)',
        waitBeforeDays: 3,
        nextNodeId: 'end',
    },
    // ── Terminal ─────────────────────────────────────────────────────────
    {
        id: 'end',
        type: 'end',
        label: 'End of sequence',
        waitBeforeDays: 0,
    },
]

// Lookup a node by id
export function getNode(nodeId: string, customNodes?: SequenceNode[]): SequenceNode | undefined {
    const nodes = customNodes?.length ? customNodes : DEFAULT_SEQUENCE
    return nodes.find(n => n.id === nodeId)
}

// Determine the next node id for a given node after execution.
// For condition nodes, pass linkedinConnected to choose the branch.
export function resolveNextNode(nodeId: string, customNodes?: SequenceNode[], linkedinConnected?: boolean): string | undefined {
    const node = getNode(nodeId, customNodes)
    if (!node) return undefined
    if (node.type === 'condition') {
        return linkedinConnected ? node.yesNodeId : node.noNodeId
    }
    return node.nextNodeId
}

// Calculate the ISO timestamp when a node should execute
// (now + waitBeforeDays of the NEXT node)
export function calcWaitUntil(nextNodeId: string, customNodes?: SequenceNode[]): string {
    const node = getNode(nextNodeId, customNodes)
    const days = node?.waitBeforeDays ?? 0
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}
