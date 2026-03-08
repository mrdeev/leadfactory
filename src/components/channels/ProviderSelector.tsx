"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Linkedin, Instagram, Send, Loader2 } from "lucide-react";
import { useAuthContext } from "@/components/providers/AuthProvider";

export function ProviderSelector() {
    const { user } = useAuthContext();
    const [connecting, setConnecting] = useState<string | null>(null);

    const handleConnect = async (provider: string) => {
        setConnecting(provider);
        try {
            const res = await fetch('/api/linkedin/hosted-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    userId: user?.id,
                    redirectUrl: window.location.href // return back here
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("No URL returned", data);
                setConnecting(null);
            }
        } catch (e) {
            console.error(e);
            setConnecting(null);
        }
    }

    const providers = [
        { id: 'LINKEDIN', name: 'LinkedIn', icon: Linkedin, colors: 'from-[#0A66C2] to-[#004182]', bg: 'bg-[#0A66C2]/10', text: 'text-[#0A66C2]', border: 'border-[#0A66C2]/20' },
        { id: 'MAIL', name: 'Email (SMTP)', icon: Mail, colors: 'from-rose-500 to-red-600', bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
        { id: 'WHATSAPP', name: 'WhatsApp', icon: MessageCircle, colors: 'from-[#25D366] to-[#128C7E]', bg: 'bg-[#25D366]/10', text: 'text-[#25D366]', border: 'border-[#25D366]/20' },
        { id: 'INSTAGRAM', name: 'Instagram', icon: Instagram, colors: 'from-[#E1306C] to-[#833AB4]', bg: 'bg-[#E1306C]/10', text: 'text-[#E1306C]', border: 'border-[#E1306C]/20' },
        { id: 'TELEGRAM', name: 'Telegram', icon: Send, colors: 'from-[#0088cc] to-[#005580]', bg: 'bg-[#0088cc]/10', text: 'text-[#0088cc]', border: 'border-[#0088cc]/20' },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Connect New Channel</h2>
            <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
                {providers.map(p => (
                    <button
                        key={p.id}
                        onClick={() => handleConnect(p.id)}
                        disabled={connecting !== null}
                        className={`group relative flex-none w-48 snap-start rounded-xl border ${p.border} bg-card p-5 text-left transition-all hover:scale-105 hover:shadow-xl hover:shadow-${p.colors.split(' ')[0].replace('from-', '')}/20 overflow-hidden`}
                    >
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${p.colors} transition-opacity duration-500 pointer-events-none`} />
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${p.bg} ${p.text} mb-4 transition-transform group-hover:scale-110`}>
                            {connecting === p.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <p.icon className="h-5 w-5" />}
                        </div>
                        <h3 className="font-semibold text-foreground text-sm">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Connect account</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
