"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Linkedin, Check, Upload, FileText, X } from "lucide-react"
import { useRef } from "react"

export function TrainAiStep() {
    const [url, setUrl] = useState("https://www.linkedin.com/in/noor-ahmed")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean, message: string } | null>(null)
    const [files, setFiles] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return

        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)

        setUploading(true)
        try {
            const res = await fetch('/api/ai/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (res.ok) {
                setFiles(prev => [...prev, file.name])
            } else {
                alert(data.message || "Upload failed")
            }
        } catch (err) {
            console.error(err)
            alert("Upload failed")
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeFile = (fileName: string) => {
        setFiles(prev => prev.filter(f => f !== fileName))
    }

    const handleTrain = async () => {
        if (!url) return
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/ai/train', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkedinUrl: url })
            })
            const data = await res.json()
            if (res.ok) {
                setResult({ success: true, message: data.message })
            } else {
                setResult({ success: false, message: data.error || "Training failed" })
            }
        } catch (error) {
            setResult({ success: false, message: "Network error" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Train AI with Real-Time Customer Data</h2>
                <p className="text-sm text-slate-500 mt-1">Feed the AI with live customer data from LinkedIn posts. This makes the AI more accurate and up-to-date.</p>
            </div>

            <div className="max-w-xl mx-auto w-full">
                <div className="border border-slate-200 rounded-2xl p-10 bg-white shadow-sm space-y-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="h-16 w-16 bg-[#0077b5]/5 rounded-2xl flex items-center justify-center border border-[#0077b5]/10 shadow-sm">
                            <Linkedin className="h-8 w-8 text-[#0077b5]" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900">Connect LinkedIn Profile</h3>
                            <p className="text-sm text-slate-500 max-w-xs">URL of the profile you want the AI to emulate or learn from.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">LinkedIn Profile URL</label>
                            <Input
                                placeholder="https://www.linkedin.com/in/username"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="border-slate-200 h-12 rounded-xl focus-visible:ring-slate-900 focus-visible:border-slate-900"
                            />
                        </div>
                        <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black font-bold text-white transition-all shadow-lg shadow-slate-200" onClick={handleTrain} disabled={loading || !url}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing Profile...
                                </>
                            ) : (
                                "Train AI with LinkedIn"
                            )}
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500 font-bold tracking-widest">Or Upload Knowledge</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".md,.txt,.pdf" // Accepting md, txt, pdf as per plan
                                onChange={handleFileUpload}
                            />
                            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                {uploading ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <Upload className="h-6 w-6 text-primary" />}
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">Click to upload knowledge base</h4>
                            <p className="text-xs text-slate-500 mt-1">Supports .md, .txt files</p>
                        </div>

                        {files.length > 0 && (
                            <div className="space-y-2">
                                {files.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{file}</span>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); removeFile(file); }} className="text-slate-400 hover:text-red-500">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {result && (
                        <div className={`p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border animate-in zoom-in-95 duration-300 ${result.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            {result.success ? (
                                <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                                    <Check className="h-3 w-3" />
                                </div>
                            ) : null}
                            {result.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
