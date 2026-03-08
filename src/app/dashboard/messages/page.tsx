"use client";

import { useState } from "react";
import { InboxSidebar, InboxConversation } from "@/components/inbox/InboxSidebar";
import { InboxChat } from "@/components/inbox/InboxChat";

// Full mock data matching the screenshot
const MOCK_CONVERSATIONS: InboxConversation[] = [
    {
        id: "1",
        contactName: "Marc Benioff",
        contactRole: "CEO",
        contactCompany: "Salesforce",
        lastMessage: "I saw your latest post on AI agents—very timely.",
        time: "2m",
        channel: "linkedin",
        unread: true,
        classification: "HOT LEAD",
    },
    {
        id: "2",
        contactName: "Sam Altman",
        contactRole: "CEO",
        contactCompany: "OpenAI",
        lastMessage: "Interesting pipeline feature.",
        time: "1h",
        channel: "linkedin",
        unread: true,
        classification: "QUESTION",
    },
    {
        id: "3",
        contactName: "Elon Musk",
        contactRole: "CEO",
        contactCompany: "Tesla",
        lastMessage: "Let's catch up next week.",
        time: "3h",
        channel: "email",
        unread: false,
    },
    {
        id: "4",
        contactName: "Satya Nadella",
        contactRole: "CEO",
        contactCompany: "Microsoft",
        lastMessage: "The integration looks solid. Do you have documentation?",
        time: "5h",
        channel: "whatsapp",
        unread: true,
        classification: "QUESTION",
    },
    {
        id: "5",
        contactName: "Tim Cook",
        contactRole: "CEO",
        contactCompany: "Apple",
        lastMessage: "Not a priority for us right now, but thanks.",
        time: "1d",
        channel: "email",
        unread: false,
        classification: "NOT INTERESTED",
    },
    {
        id: "6",
        contactName: "Jensen Huang",
        contactRole: "CEO",
        contactCompany: "NVIDIA",
        lastMessage: "Thanks for the overview.",
        time: "2d",
        channel: "linkedin",
        unread: false,
    },
];

export default function MessagesPage() {
    const [selectedId, setSelectedId] = useState<string | null>(MOCK_CONVERSATIONS[0].id);
    const [activeTab, setActiveTab] = useState("all");

    // Filter logic
    const filteredConversations = MOCK_CONVERSATIONS.filter(c => {
        if (activeTab === "unread") return c.unread;
        if (activeTab === "hot") return c.classification === "HOT LEAD";
        if (activeTab === "questions") return c.classification === "QUESTION";
        return true; // "all"
    });

    const activeConversation = MOCK_CONVERSATIONS.find(c => c.id === selectedId) || null;

    return (
        <div className="h-[calc(100vh-8rem)] w-full flex bg-white rounded-xl shadow-sm border border-slate-200 animate-slide-up">
            <InboxSidebar
                conversations={filteredConversations}
                selectedId={selectedId}
                onSelect={setSelectedId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            <InboxChat conversation={activeConversation} />
        </div>
    );
}
