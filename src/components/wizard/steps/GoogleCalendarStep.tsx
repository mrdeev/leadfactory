"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Check, Loader2, Link2, AlertCircle } from "lucide-react"

export function GoogleCalendarStep({ productId }: { productId: string }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/products/${productId}`);
                if (res.ok) {
                    const data = await res.json();
                    setIsConnected(!!data.calendarConfig?.connected);
                }
            } catch (err) {
                console.error("Failed to check calendar status", err);
            } finally {
                setIsLoading(false);
            }
        };
        checkStatus();

        // Check for success param in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            setIsConnected(true);
        }
    }, [productId]);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const res = await fetch(`/api/auth/google/url?productId=${productId}`);
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Failed to get auth URL");
            }
        } catch (err) {
            console.error("Connection error", err);
            alert("Network error connecting to Google");
        } finally {
            setIsConnecting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Google Calendar Integration</h2>
                <p className="text-sm text-slate-500 mt-1">Connect your Google Calendar to enable automatic appointment booking.</p>
            </div>

            <div className="grid gap-6">
                <div className="border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-8 bg-white shadow-sm min-h-[400px]">
                    <div className={cn(
                        "h-24 w-24 rounded-full flex items-center justify-center border shadow-inner transition-all duration-500",
                        isConnected ? "bg-emerald-50 border-emerald-100" : "bg-primary/10 border-primary/20"
                    )}>
                        {isConnected ? (
                            <Check className="h-12 w-12 text-emerald-600" />
                        ) : (
                            <Calendar className="h-12 w-12 text-primary" />
                        )}
                    </div>

                    <div className="max-w-md space-y-3">
                        <h3 className="text-xl font-bold text-slate-900">
                            {isConnected ? "Calendar Connected!" : "Connect your calendar"}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {isConnected
                                ? "Your Google Calendar is successfully linked. Our AI agent can now check your availability and schedule meetings directly into your calendar."
                                : "Allow the AI to check your availability and book meetings directly into your schedule. This helps convert leads faster by reducing friction."}
                        </p>
                    </div>

                    {isConnected ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                ACTIVE: Lead Capture Enabled
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleConnect}
                                className="text-slate-500 border-slate-200 hover:bg-slate-50 text-xs"
                            >
                                <Link2 className="h-3 w-3 mr-2" /> Reconnect Account
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm h-12 px-8 font-bold rounded-xl"
                        >
                            {isConnecting ? (
                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            ) : (
                                <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
                            )}
                            {isConnecting ? "Connecting..." : "Sign in with Google"}
                        </Button>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <Check className="h-3 w-3 text-emerald-500" />
                            </div>
                            Read-only access to availability
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <Check className="h-3 w-3 text-emerald-500" />
                            </div>
                            Create calendar events
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
