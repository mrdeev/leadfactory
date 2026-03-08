"use client"

import { useState, useEffect } from "react"
import {
    Search,
    Bell,
    HelpCircle,
    SlidersHorizontal,
    UserSearch,
    Mail,
    Phone,
    Globe,
    UserPlus,
    Sparkles,
    LayoutDashboard,
    Linkedin,
    X,
    Check,
    Briefcase,
    MapPin,
    Users,
    Loader2
} from "lucide-react"
import { industries } from "@/components/industries"
import { jobTitles as jobTitlesList } from "@/components/jobTitles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox"

// Map industries and job titles for select options
const industryOptions = industries.map(ind => ({ label: ind, value: ind }))
const jobTitleOptions = jobTitlesList.map(title => ({ label: title, value: title }))

export default function LinkedinScraperPage() {
    // --- Main Filters State ---
    const [industry, setIndustry] = useState<string[]>([])
    const [location, setLocation] = useState<string>("")
    const [jobTitles, setJobTitles] = useState<string[]>([])

    // --- Advanced Filters State ---
    const [keywords, setKeywords] = useState("")
    const [companySize, setCompanySize] = useState("")
    const [emailStatus, setEmailStatus] = useState("Verified")
    const [hasEmail, setHasEmail] = useState(true)
    const [hasPhone, setHasPhone] = useState(false)
    const [maxResults, setMaxResults] = useState(1)

    // --- Scraping Options State ---
    const [scrapePosts, setScrapePosts] = useState(true)
    const [scrapeWebsite, setScrapeWebsite] = useState(false)

    // --- Results State ---
    const [leads, setLeads] = useState<any[]>([])
    const [selectedLeads, setSelectedLeads] = useState<number[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deepLoading, setDeepLoading] = useState<Record<string, boolean>>({})

    // Custom CSS for scrollbars
    const scrollbarStyles = `
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #334155;
        }
        .dark .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background: #475569;
        }
    `;

    const handleSearch = async () => {
        setLoading(true)
        setError(null)
        setLeads([]) // Clear previous results

        // Construct payload matching the backend logic
        // Note: Backend expects arrays for industry/jobTitles if specific
        const payload = {
            industry: industry.length > 0 ? industry : [],
            location,
            jobTitles: jobTitles.length > 0 ? jobTitles : [],
            keywords,
            companySize,
            emailStatus,
            hasEmail,
            hasPhone,
            maxResults,
            // New flags
            scrapePosts,
            scrapeWebsite
        }

        console.log('=== SEARCH PAYLOAD ===', payload)

        try {
            const res = await fetch('/api/run-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Failed to fetch leads')
            }

            const data = await res.json()

            // Check if the response is an error object
            if (data.error) {
                throw new Error(data.error)
            }

            if (Array.isArray(data)) {
                // Map API data to our UI expected structure if needed
                // The UI expects `insights` and `websiteContent`. 
                // The API currently returns `generatedEmail` as the main "AI" output.
                // We'll map `generatedEmail` to `insights` for now to show something, 
                // or just use what's available.
                const mappedLeads = data.map((item: any, index: number) => ({
                    ...item,
                    id: index, // Use index or item.id if available
                    name: item.fullName,
                    title: item.position,
                    company: item.orgName,
                    insights: item.insights || [],
                    websiteContent: item.websiteContent || []
                }))
                setLeads(mappedLeads)
                console.log('Processed Leads:', mappedLeads)
            } else {
                setLeads([])
            }
        } catch (err: any) {
            console.error('Search error:', err)
            if (err.name === 'AbortError' || err.message.includes('timeout') || err.message.includes('signal')) {
                setError('The search is taking longer than expected. Please try reducing the Max Results or turning off some scraping options.')
            } else {
                setError(err.message || 'An unexpected error occurred while searching for leads.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDeepScrape = async (leadId: string, type: 'linkedin' | 'website') => {
        const leadIndex = leads.findIndex(l => l.id === leadId)
        if (leadIndex === -1) return

        const lead = leads[leadIndex]
        const loadingKey = `${leadId}-${type}`

        setDeepLoading(prev => ({ ...prev, [loadingKey]: true }))

        try {
            const response = await fetch('/api/run-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deepAnalysis: true,
                    specificLead: lead,
                    scrapePosts: type === 'linkedin',
                    scrapeWebsite: type === 'website'
                })
            })

            if (!response.ok) throw new Error('Deep analysis failed')

            const results = await response.json()
            if (!results || results.length === 0) throw new Error('No results returned')

            const updatedLead = results[0]

            setLeads(prev => prev.map(l => l.id === leadId ? {
                ...l,
                ...(type === 'linkedin' ? { insights: updatedLead.insights } : { websiteContent: updatedLead.websiteContent })
            } : l))

        } catch (err) {
            console.error('Deep scrape error:', err)
        } finally {
            setDeepLoading(prev => ({ ...prev, [loadingKey]: false }))
        }
    }

    const toggleLeadSelection = (id: number) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(leadId => leadId !== id))
        } else {
            setSelectedLeads([...selectedLeads, id])
        }
    }

    const toggleSelectAll = () => {
        if (selectedLeads.length === leads.length && leads.length > 0) {
            setSelectedLeads([])
        } else {
            setSelectedLeads(leads.map(lead => lead.id))
        }
    }

    // --- Products State ---
    const [products, setProducts] = useState<{ id: string, name: string }[]>([])

    // --- Initial Data Fetching ---
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products')
                if (res.ok) {
                    const data = await res.json()
                    setProducts(data)
                }
            } catch (error) {
                console.error("Failed to fetch products", error)
            }
        }
        fetchProducts()
    }, [])

    const handleSaveToContacts = async (leadsToSave: any[], clearSelectionAfter = false) => {
        if (leadsToSave.length === 0) return

        // Default to first product if available
        const targetProductId = products.length > 0 ? products[0].id : null

        if (!targetProductId) {
            alert("No products found. Please create a product first.")
            return
        }

        const contacts = leadsToSave.map(lead => ({
            fullName: lead.name,
            email: lead.email,
            orgName: lead.company,
            position: lead.title,
            phone: lead.phone,
            linkedinUrl: lead.linkedinUrl
        }))

        try {
            // We'll save them one by one or in batch if API supports it.
            // The API (api/contacts/route.ts) supports array in POST body.
            const res = await fetch(`/api/contacts?productId=${targetProductId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contacts)
            })

            if (res.ok) {
                const result = await res.json()
                alert(result.message || `Successfully saved ${contacts.length} contacts.`)
                if (clearSelectionAfter) {
                    setSelectedLeads([])
                }
            } else {
                throw new Error("Failed to save contacts")
            }
        } catch (error) {
            console.error("Save failed", error)
            alert("Failed to save contacts. Please try again.")
        }
    }



    return (
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 p-6 md:p-8 custom-scrollbar">
            <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">LinkedIn Scraper</h2>
                    <p className="text-slate-500 mt-1">Target, extract, and enrich professional leads with real-time AI insights.</p>
                </div>

                {/* Filters Section */}
                <section className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">Search Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Industry</label>
                            <div className="relative">
                                <MultiSelectCombobox
                                    options={industryOptions}
                                    selected={industry}
                                    onChange={setIndustry}
                                    placeholder="Select Industry..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Location</label>
                            <div className="relative">
                                <Input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="City, State, Country"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Job Titles</label>
                            <div className="relative">
                                <MultiSelectCombobox
                                    options={jobTitleOptions}
                                    selected={jobTitles}
                                    onChange={setJobTitles}
                                    placeholder="Select Job Title..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                                />
                            </div>
                        </div>
                        <div>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold h-10 px-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                        <SlidersHorizontal className="w-4 h-4" />
                                        Advanced Filters
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto sm:pl-10">
                                    <SheetHeader>
                                        <SheetTitle>Advanced Filters</SheetTitle>
                                        <SheetDescription>
                                            Refine your search with granular controls.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="grid gap-6 py-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Keywords</label>
                                            <Input
                                                value={keywords}
                                                onChange={(e) => setKeywords(e.target.value)}
                                                placeholder="e.g. SaaS, AI, B2B"
                                            />
                                            <p className="text-xs text-slate-500">Keywords in company description/name.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Company Size</label>
                                            <Select value={companySize} onValueChange={setCompanySize}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1 - 10">1 - 10</SelectItem>
                                                    <SelectItem value="11 - 50">11 - 50</SelectItem>
                                                    <SelectItem value="51 - 200">51 - 200</SelectItem>
                                                    <SelectItem value="201 - 500">201 - 500</SelectItem>
                                                    <SelectItem value="501 - 1000">501 - 1000</SelectItem>
                                                    <SelectItem value="1001 - 5000">1001 - 5000</SelectItem>
                                                    <SelectItem value="5001 - 10000">5001 - 10000</SelectItem>
                                                    <SelectItem value="10001+">10001+</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Email Status</label>
                                            <Select value={emailStatus} onValueChange={setEmailStatus}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Verified">Verified Only</SelectItem>
                                                    <SelectItem value="Unverified">Unverified</SelectItem>
                                                    <SelectItem value="All">All</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between border p-4 rounded-lg">
                                            <div className="space-y-0.5">
                                                <label className="text-base font-medium">Must Have Email</label>
                                                <p className="text-xs text-slate-500">Only show leads with email addresses</p>
                                            </div>
                                            <Switch checked={hasEmail} onCheckedChange={setHasEmail} />
                                        </div>

                                        <div className="flex items-center justify-between border p-4 rounded-lg">
                                            <div className="space-y-0.5">
                                                <label className="text-base font-medium">Must Have Phone</label>
                                                <p className="text-xs text-slate-500">Only show leads with phone numbers</p>
                                            </div>
                                            <Switch checked={hasPhone} onCheckedChange={setHasPhone} />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Max Results</label>
                                            <Input
                                                type="number"
                                                value={maxResults || ''}
                                                onChange={(e) => setMaxResults(Number(e.target.value))}
                                                placeholder="10"
                                            />
                                            <p className="text-xs text-slate-500">Max leads to fetch (Max 50k).</p>
                                        </div>
                                    </div>
                                    <SheetFooter>
                                        <SheetClose asChild>
                                            <Button>Save Filters</Button>
                                        </SheetClose>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>

                    {/* Scraping Options */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">Scraping Options</h3>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex flex-wrap gap-12">
                                <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={scrapePosts}
                                            onChange={(e) => setScrapePosts(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Scrape LinkedIn Posts</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={scrapeWebsite}
                                            onChange={(e) => setScrapeWebsite(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Scrape Website Content</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 w-full md:w-auto self-end md:self-auto ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        Searching...
                                    </span>
                                ) : (
                                    <>
                                        <UserSearch className="w-5 h-5" />
                                        Find Leads
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Results Header */}
                <div className="mb-6 flex items-center justify-between px-1">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 w-5 h-5 transition-all"
                                checked={leads.length > 0 && selectedLeads.length === leads.length}
                                onChange={toggleSelectAll}
                            />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">Select All</span>
                        </label>
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                            Showing {leads.length} leads
                        </span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20">
                        Error: {error}
                    </div>
                )}

                {/* Lead Cards Container */}
                <div className="space-y-6">
                    {leads.map((lead) => (
                        <div key={lead.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Left Profile Info */}
                                    <div className="w-full md:w-1/3 flex flex-col justify-between border-r border-slate-100 dark:border-slate-800 pr-6">
                                        <div>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{lead.name}</h4>
                                                    <p className="text-blue-600 font-semibold text-sm">{lead.title}</p>
                                                    <p className="text-slate-500 text-xs mt-1">{lead.company}</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 w-5 h-5 transition-all"
                                                    checked={selectedLeads.includes(lead.id)}
                                                    onChange={() => toggleLeadSelection(lead.id)}
                                                />
                                            </div>

                                            <div className="mt-4 space-y-3">
                                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                    <Mail className="w-4 h-4 text-blue-600/60" />
                                                    <span className="truncate">{lead.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                    <Phone className="w-4 h-4 text-blue-600/60" />
                                                    <span>{lead.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                    <Globe className="w-4 h-4 text-blue-600/60" />
                                                    <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 underline underline-offset-4 decoration-blue-600/30 truncate max-w-[200px]">
                                                        {lead.linkedinUrl?.replace('https://', '')}
                                                    </a>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-1.5 hover:underline group/link">
                                                    <Linkedin className="w-4 h-4 fill-blue-600" />
                                                    <span className="text-sm font-bold">LinkedIn Profile</span>
                                                </a>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <button
                                                onClick={() => handleSaveToContacts([lead])}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center gap-2">
                                                <UserPlus className="w-5 h-5" />
                                                Save to Contacts
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right Insights Sections */}
                                    <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
                                        {/* LinkedIn Insights Card */}
                                        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 group shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs font-bold uppercase tracking-tight text-slate-500">LinkedIn Insights</span>
                                                </div>
                                                {deepLoading[`${lead.id}-linkedin`] && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                                {lead.insights && lead.insights.length > 0 ? (
                                                    <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        {lead.insights.map((insight: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-2 group/item">
                                                                <span className="text-blue-600 mt-1 text-[8px] opacity-60">•</span>
                                                                <span dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic">No insights generated yet.</p>
                                                )}
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                                <button
                                                    disabled={deepLoading[`${lead.id}-linkedin`]}
                                                    onClick={() => handleDeepScrape(lead.id, 'linkedin')}
                                                    className="w-full py-1.5 rounded-lg text-[10px] font-bold text-blue-600 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1">
                                                    {deepLoading[`${lead.id}-linkedin`] ? 'Analyzing...' : 'Scrape More Insights'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Website Contents Card */}
                                        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 group shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs font-bold uppercase tracking-tight text-slate-500">Website Contents</span>
                                                </div>
                                                {deepLoading[`${lead.id}-website`] && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                                {lead.websiteContent && lead.websiteContent.length > 0 ? (
                                                    <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        {lead.websiteContent.map((content: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <span className="text-blue-600 mt-1 text-[8px] opacity-60">•</span>
                                                                <span>{content}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic">No website content scraped.</p>
                                                )}
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                                <button
                                                    disabled={deepLoading[`${lead.id}-website`]}
                                                    onClick={() => handleDeepScrape(lead.id, 'website')}
                                                    className="w-full py-1.5 rounded-lg text-[10px] font-bold text-blue-600 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-1">
                                                    {deepLoading[`${lead.id}-website`] ? 'Analyzing...' : 'Scrape More Insights'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bulk Action Floating Bar */}
            {selectedLeads.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-blue-600 shadow-2xl shadow-blue-600/40 rounded-full py-3 px-6 md:px-8 flex items-center justify-between border border-white/20 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                                <span className="text-sm font-bold">{selectedLeads.length}</span>
                            </div>
                            <span className="text-white font-semibold text-sm hidden md:inline">Leads selected for bulk action</span>
                            <span className="text-white font-semibold text-sm md:hidden">Selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleSaveToContacts(leads.filter(l => selectedLeads.includes(l.id)), true)}
                                className="bg-white text-blue-600 hover:bg-slate-50 font-bold px-6 py-2 rounded-full text-sm transition-all shadow-md">
                                Save Selected to Contacts
                            </button>
                            <button
                                onClick={() => setSelectedLeads([])}
                                className="text-white/80 hover:text-white flex items-center justify-center p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
