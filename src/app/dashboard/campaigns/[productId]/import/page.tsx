"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CampaignTopBar } from "@/components/campaign/CampaignTopBar"
import { ImportContactsStep } from "@/components/wizard/steps/ImportContactsStep"

export default function CampaignImportPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = use(params)
    const router = useRouter()
    const [product, setProduct] = useState<any>(null)

    useEffect(() => {
        fetch(`/api/products/${productId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => setProduct(data))
    }, [productId])

    return (
        <div className="fixed inset-0 flex flex-col bg-slate-50 z-50">
            <CampaignTopBar
                product={product}
                productId={productId}
                onClose={() => router.push('/dashboard/campaigns')}
            />

            <div className="flex-1 overflow-y-auto w-full flex justify-center py-8">
                <div className="w-full max-w-4xl px-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm min-h-[500px]">
                        <ImportContactsStep productId={productId} />
                    </div>
                </div>
            </div>
        </div>
    )
}
