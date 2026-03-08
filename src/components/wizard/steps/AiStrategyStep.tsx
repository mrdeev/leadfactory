"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Target, MessageSquare, Send, Clock, BarChart } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Strategy {
    targetAudience: string
    keyValueMessages: string
    outreachApproach: string
    followUpStrategy: string
    successMetrics: string
}

export function AiStrategyStep({ productId }: { productId: string }) {
    const [strategy, setStrategy] = useState<Strategy | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [product, setProduct] = useState<any>(null)

    // Load existing strategy or product data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`/api/products/${productId}`)
                if (res.ok) {
                    const data = await res.json()
                    console.log("Loaded product data:", data)
                    setProduct(data)
                    if (data.strategy) {
                        setStrategy(data.strategy)
                    }
                } else if (res.status === 404) {
                    // Product not found - this might happen if using a bad ID in URL
                    console.warn(`Product ${productId} not found in database.`)
                    // We don't set a hard error here to allow "Regenerate" to still work as a "New Product" feel
                    // But we can set a flag if we want
                } else {
                    const errData = await res.json().catch(() => ({}))
                    setError(errData.error || `Failed to load data (Status: ${res.status})`)
                }
            } catch (err: any) {
                console.error("Failed to load product data:", err)
                setError("Failed to connect to the server")
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [productId])

    const generateStrategy = async () => {
        // Even if product is null, we can try to generate with defaults if we have at least the productId
        setLoading(true)
        setError(null)
        try {
            console.log("Generating strategy for:", product?.name || productId)
            const res = await fetch('/api/ai/strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: product?.name || "New Product",
                    productDescription: product?.description || "",
                    pipelineTemplate: product?.pipelineTemplate || "general"
                })
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || "Failed to generate strategy")
            }

            const data = await res.json()
            setStrategy(data)

            // Persist to backend
            await fetch(`/api/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy: data }),
            });
        } catch (err: any) {
            console.error("Generation error:", err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Auto-generate if we have product but no strategy
    useEffect(() => {
        if (product && !strategy && !loading && !error) {
            generateStrategy()
        }
    }, [product, loading, strategy, error])

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900">AI Marketing Strategy</h2>
                <p className="text-sm text-slate-500 mt-1">Review how your AI sales assistant will engage with prospects.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center justify-between">
                    <span>Error: {error}</span>
                    <Button variant="ghost" size="sm" onClick={generateStrategy} className="text-red-700 hover:bg-red-100 font-bold">Retry</Button>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative min-h-[400px]">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-900 mb-4" />
                        <p className="text-slate-500 text-sm font-medium">Generating your AI strategy...</p>
                    </div>
                ) : strategy ? (
                    <div className="p-10 space-y-10">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
                            <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                                <span className="text-xl">✨</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-slate-900">Your AI Marketing Plan</h3>
                                <p className="text-sm text-slate-500">How your AI sales assistant will engage with prospects</p>
                            </div>
                        </div>

                        <div className="grid gap-10">
                            <Section
                                icon={<Target className="h-5 w-5 text-primary" />}
                                title="Target Audience"
                                content={strategy.targetAudience}
                            />
                            <Section
                                icon={<MessageSquare className="h-5 w-5 text-purple-500" />}
                                title="Key Value Messages"
                                content={strategy.keyValueMessages}
                            />
                            <Section
                                icon={<Send className="h-5 w-5 text-emerald-500" />}
                                title="Outreach Approach"
                                content={strategy.outreachApproach}
                            />
                            <Section
                                icon={<Clock className="h-5 w-5 text-amber-500" />}
                                title="Follow-up Strategy"
                                content={strategy.followUpStrategy}
                            />
                            <Section
                                icon={<BarChart className="h-5 w-5 text-primary" />}
                                title="Success Metrics"
                                content={strategy.successMetrics}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <Target className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No Strategy Generated Yet</h3>
                        <p className="text-slate-500 max-w-sm mt-2 mb-6">
                            We haven't generated a strategy for this product yet. Click the button below to create one using AI.
                        </p>
                        <Button onClick={generateStrategy} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Generate Strategy
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex justify-center">
                <Button variant="outline" onClick={generateStrategy} disabled={loading} className="border-slate-200 rounded-lg font-bold h-11 px-8 hover:bg-slate-50">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Regenerate Plan
                </Button>
            </div>
        </div>
    )
}

function Section({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
    return (
        <div className="flex gap-4">
            <div className="mt-1 shrink-0">{icon}</div>
            <div>
                <h4 className="font-medium text-sm text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{content}</p>
            </div>
        </div>
    )
}
