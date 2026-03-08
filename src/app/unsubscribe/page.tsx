
"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const contactId = searchParams.get('c');
    const productId = searchParams.get('p');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleUnsubscribe = async () => {
        if (!contactId || !productId) {
            setStatus('error');
            setMessage('Invalid unsubscribe link.');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactId, productId }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage('You have been successfully unsubscribed.');
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to unsubscribe. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('An error occurred. Please try again later.');
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg border-slate-200">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-slate-900">Unsubscribe</CardTitle>
                <CardDescription>
                    We're sorry to see you go. Click below to confirm.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex flex-col items-center">
                {status === 'idle' && (
                    <Button
                        onClick={handleUnsubscribe}
                        size="lg"
                        className="w-full bg-slate-900 hover:bg-slate-800 font-bold"
                    >
                        Confirm Unsubscribe
                    </Button>
                )}

                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p>Processing...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-2 text-center animate-in fade-in zoom-in duration-300">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Unsubscribed</h3>
                        <p className="text-slate-500 text-sm">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-2 text-center animate-in fade-in zoom-in duration-300">
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Error</h3>
                        <p className="text-red-500 text-sm">{message}</p>
                        <Button variant="outline" onClick={() => setStatus('idle')} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function UnsubscribePage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <UnsubscribeContent />
            </Suspense>
        </div>
    );
}
