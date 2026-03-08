"use client";

import { useEffect, useState } from "react";
import { Share2, RefreshCw } from "lucide-react";
import { StatCards } from "@/components/channels/StatCards";
import { ProviderSelector } from "@/components/channels/ProviderSelector";
import { ChannelList } from "@/components/channels/ChannelList";
import { Button } from "@/components/ui/button";

export default function ChannelsPage() {
    const [channels, setChannels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChannels = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/channels");
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setChannels(data.data);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChannels();
    }, []);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Share2 className="h-8 w-8 text-primary" />
                        Connected Channels
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Connect and monitor sending accounts for your outreach campaigns across all providers.
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={fetchChannels}
                    disabled={loading}
                    className="gap-2 shadow-sm"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Status
                </Button>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center border rounded-xl border-dashed">
                    <p className="text-muted-foreground animate-pulse font-medium">Loading channels...</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Top Stats Layer */}
                    <StatCards channels={channels} />

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Selector Area */}
                        <div className="xl:col-span-12">
                            <ProviderSelector />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                        {/* List Area */}
                        <ChannelList channels={channels} onRefresh={fetchChannels} />
                    </div>
                </div>
            )}
        </div>
    );
}

