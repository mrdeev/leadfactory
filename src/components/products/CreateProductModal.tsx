"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Globe, Building2, User, Mail, Target, Zap, Lightbulb, X, AlertTriangle } from "lucide-react";

interface CreateProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProductModal({ open, onOpenChange }: CreateProductModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractSuccess, setExtractSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        website: "",
        productName: "",
        description: "",
        industry: "",
        ceoName: "",
        ceoEmail: "",
        targetCustomers: "",
        painPoints: "",
        valueProp: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAiExtract = async () => {
        if (!formData.website) return;

        setIsExtracting(true);
        setExtractSuccess(false);
        setError(null);
        try {
            const response = await fetch('/api/ai/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: formData.website }),
            });

            const data = await response.json();

            if (response.ok) {
                setFormData(prev => ({
                    ...prev,
                    productName: data.productName || prev.productName,
                    description: data.description || prev.description,
                    industry: data.industry || prev.industry,
                    targetCustomers: data.targetCustomers || prev.targetCustomers,
                    painPoints: data.painPoints || prev.painPoints,
                    valueProp: data.valueProposition || data.valueProp || prev.valueProp,
                }));
                setExtractSuccess(true);
            } else {
                setError(data.error || 'Extraction failed. Please try again.');
            }
        } catch (err) {
            console.error('Extraction failed:', err);
            setError('Connection failed. Please check your internet.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const product = await response.json();
                // Redirect to setup wizard with the actual ID
                router.push(`/dashboard/${product.id}/setup`);
                onOpenChange(false);
            } else {
                const error = await response.json();
                console.error('Failed to create product:', error.error);
            }
        } catch (error) {
            console.error('Error creating product:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none rounded-2xl shadow-2xl">
                <DialogHeader className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-slate-900 p-2 rounded-lg">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-slate-900">Add a Company</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-500 text-base">
                        Add a new company and set up your sales automation
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="website" className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                                Website URL (optional)
                            </Label>
                            <div className="relative group">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                <Input
                                    id="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com"
                                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleAiExtract}
                                    disabled={isExtracting || !formData.website}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-700 hover:bg-slate-300 gap-1.5 h-8 font-medium"
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    {isExtracting ? "Extracting..." : "AI Extract"}
                                </Button>
                            </div>
                            {extractSuccess && (
                                <p className="text-[12px] text-green-600 font-medium flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> AI extracted info - review and edit below
                                </p>
                            )}
                            {error && (
                                <p className="text-[12px] text-red-500 font-medium flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> {error}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="productName" className="text-sm font-semibold text-slate-700">
                                Company Name *
                            </Label>
                            <Input
                                id="productName"
                                value={formData.productName}
                                onChange={handleInputChange}
                                placeholder="e.g., Acme Sales Platform"
                                required
                                className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Brief description of your company..."
                                className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="industry" className="text-sm font-semibold text-slate-700">
                                Industry
                            </Label>
                            <Input
                                id="industry"
                                value={formData.industry}
                                onChange={handleInputChange}
                                placeholder="e.g., SaaS, E-commerce"
                                className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900"
                            />
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Details</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ceoName" className="text-xs font-semibold text-slate-600">
                                        CEO / Founder Name
                                    </Label>
                                    <Input
                                        id="ceoName"
                                        value={formData.ceoName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., John Smith"
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ceoEmail" className="text-xs font-semibold text-slate-600">
                                        CEO / Founder Email
                                    </Label>
                                    <Input
                                        id="ceoEmail"
                                        type="email"
                                        value={formData.ceoEmail}
                                        onChange={handleInputChange}
                                        placeholder="e.g., john@company.com"
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="targetCustomers" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Target className="h-4 w-4 text-slate-400" />
                                Target Customers
                            </Label>
                            <Textarea
                                id="targetCustomers"
                                value={formData.targetCustomers}
                                onChange={handleInputChange}
                                placeholder="Who are your ideal customers?"
                                className="min-h-[80px] bg-slate-50 border-slate-200 focus:bg-white text-slate-900 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="painPoints" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-slate-400" />
                                Pain Points
                            </Label>
                            <Textarea
                                id="painPoints"
                                value={formData.painPoints}
                                onChange={handleInputChange}
                                placeholder="What problems do you solve?"
                                className="min-h-[80px] bg-slate-50 border-slate-200 focus:bg-white text-slate-900 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="valueProp" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-slate-400" />
                                Value Proposition
                            </Label>
                            <Textarea
                                id="valueProp"
                                value={formData.valueProp}
                                onChange={handleInputChange}
                                placeholder="What makes your company unique?"
                                className="min-h-[80px] bg-slate-50 border-slate-200 focus:bg-white text-slate-900 resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-slate-500 hover:text-slate-900 h-12 px-6 font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-black hover:bg-slate-800 text-white h-12 px-8 rounded-xl font-semibold flex-1 sm:flex-none gap-2"
                        >
                            {isLoading ? "Creating..." : "Create & Setup"}
                            <X className="h-4 w-4 rotate-45" /> {/* Using X rotated as a Plus/Arrow replacement for "plus" feel */}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
