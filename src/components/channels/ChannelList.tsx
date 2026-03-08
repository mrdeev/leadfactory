"use client";

import { useState } from "react";
import { MoreVertical, Settings, Trash2, Mail, MessageCircle, Linkedin, Instagram, Send, RefreshCw, Link2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PROVIDER_CONFIG: Record<string, any> = {
    LINKEDIN: { name: 'LinkedIn', icon: Linkedin, color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10' },
    MAIL: { name: 'Email', icon: Mail, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    WHATSAPP: { name: 'WhatsApp', icon: MessageCircle, color: 'text-[#25D366]', bg: 'bg-[#25D366]/10' },
    INSTAGRAM: { name: 'Instagram', icon: Instagram, color: 'text-[#E1306C]', bg: 'bg-[#E1306C]/10' },
    TELEGRAM: { name: 'Telegram', icon: Send, color: 'text-[#0088cc]', bg: 'bg-[#0088cc]/10' },
    UNKNOWN: { name: 'Unknown', icon: Link2, color: 'text-gray-500', bg: 'bg-gray-100' }
};

export function ChannelList({ channels, onRefresh }: { channels: any[], onRefresh: () => void }) {

    // Group channels by provider
    const grouped = channels.reduce((acc, channel) => {
        const p = channel.provider || 'UNKNOWN';
        if (!acc[p]) acc[p] = [];
        acc[p].push(channel);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="space-y-8">
            {Object.entries(grouped).length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/50">
                    <p className="text-muted-foreground">No channels connected yet. Select a provider above to get started.</p>
                </div>
            ) : (
                Object.entries(grouped).map(([providerKey, providerChannels]) => {
                    const channelsList = providerChannels as any[];
                    const config = PROVIDER_CONFIG[providerKey] || PROVIDER_CONFIG.UNKNOWN;
                    const Icon = config.icon;

                    return (
                        <div key={providerKey} className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                                <Icon className={`h-5 w-5 ${config.color}`} />
                                <h3 className="text-lg font-semibold tracking-tight">{config.name} Accounts</h3>
                                <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0.5 text-xs font-normal">
                                    {channelsList.length}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {channelsList.map(channel => (
                                    <div key={channel.id} className="group rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-border">

                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${config.bg} ${config.color}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground truncate max-w-[150px]" title={channel.name}>
                                                        {channel.name || 'Unnamed Account'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Added {new Date(channel.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        <span>Sync Status</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <Settings className="mr-2 h-4 w-4" />
                                                        <span>Settings</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Disconnect</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Status & ID */}
                                        <div className="flex items-center justify-between mt-4 p-3 bg-muted/40 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${channel.status === 'STOPPED' || channel.status === 'CREDENTIALS' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                <span className="text-xs font-medium text-foreground">
                                                    {channel.status === 'STOPPED' || channel.status === 'CREDENTIALS' ? 'Needs Attention' : 'Operational'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-muted-foreground px-2 py-1 bg-background rounded border border-border/50 truncate max-w-[100px]" title={channel.unipileAccountId}>
                                                {channel.unipileAccountId}
                                            </span>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    );
}
