"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
    Search, Users, Briefcase, MapPin, BadgeCheck, FileText, ChevronDown, Plus, X, Globe, Phone, Mail, Sparkles, Building2, MonitorSmartphone, Target, Activity, Zap, Factory, Banknote
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FilterDropdown, FilterValue } from "@/components/leads-finder/FilterDropdown"
import { FilterGroup, FilterConfig } from "@/components/leads-finder/FilterGroup"

export default function LinkedinScraperPage() {
    // ---------------------------------------------------------------------------
    // Complex Filter State Management
    // ---------------------------------------------------------------------------

    // We store all dropdown filter states here (e.g. { 'job-title': [{value: 'CEO', type: 'include'}] })
    const [dropdownFilters, setDropdownFilters] = useState<Record<string, FilterValue[]>>({});
    // We store all checkbox filter states here (e.g. { 'not-in-campaign': true })
    const [checkboxFilters, setCheckboxFilters] = useState<Record<string, boolean>>({});

    // UI States
    const [loading, setLoading] = useState(false)
    const [leads, setLeads] = useState<any[]>([])
    const [selectedLeads, setSelectedLeads] = useState<number[]>([])
    const [error, setError] = useState<string | null>(null)

    // Handlers
    const handleDropdownChange = (filterId: string, values: FilterValue[]) => {
        setDropdownFilters(prev => ({ ...prev, [filterId]: values }));
    };

    const handleCheckboxChange = (filterId: string, checked: boolean) => {
        setCheckboxFilters(prev => ({ ...prev, [filterId]: checked }));
    };

    // ---------------------------------------------------------------------------
    // Filter Configuration Schema (34 Filters mapping exactly to user request)
    // ---------------------------------------------------------------------------
    const GENERAL_FILTERS: FilterConfig[] = [
        { id: 'not-in-all', label: 'Not already in All contacts', type: 'checkbox', icon: <Users className="w-3.5 h-3.5" /> },
        { id: 'not-in-campaign', label: 'Not already in a campaign', type: 'checkbox', icon: <Target className="w-3.5 h-3.5" /> },
        { id: 'job-title', label: 'Current Job Title', type: 'dropdown', icon: <Briefcase className="w-3.5 h-3.5" />, suggestions: ['CEO', 'Founder', 'Co-Founder', 'Owner', 'President', 'Vice President', 'Director', 'Head', 'Manager', 'Sales', 'Sales Development Representative', 'Account Executive', 'Account Manager', 'Software Engineer', 'Senior Software Engineer', 'Product Manager', 'Marketing', 'Marketing Director', 'CTO', 'CFO', 'CMO', 'COO'] },
        { id: 'country', label: 'Country', type: 'dropdown', icon: <Globe className="w-3.5 h-3.5" />, suggestions: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Brazil', 'Netherlands', 'Spain', 'Italy', 'Sweden', 'Switzerland', 'Singapore', 'Ireland', 'New Zealand', 'South Africa'] },
        { id: 'keyword-profile', label: 'Keyword in Profile', type: 'dropdown', icon: <Search className="w-3.5 h-3.5" /> },
        { id: 'department', label: 'Department', type: 'dropdown', icon: <Building2 className="w-3.5 h-3.5" />, suggestions: ['Administrative', 'Engineering', 'Information Technology', 'Sales', 'Marketing', 'Human Resources', 'Operations', 'Finance', 'Legal', 'Product Management', 'Customer Success', 'Support', 'Design', 'Research & Development'] },
        { id: 'position-tenure', label: 'Current Position Tenure', type: 'dropdown', icon: <Activity className="w-3.5 h-3.5" />, suggestions: ['Less than 1 year', '1-2 years', '3-5 years', 'More than 5 years', 'More than 10 years'] },
        { id: 'seniority', label: 'Seniority', type: 'dropdown', icon: <BadgeCheck className="w-3.5 h-3.5" />, suggestions: ['Owner', 'Partner', 'CXO', 'VP', 'Director', 'Manager', 'Senior', 'Entry', 'Training', 'Unpaid'] },
        { id: 'years-experience', label: 'Years of Experience', type: 'dropdown', icon: <FileText className="w-3.5 h-3.5" />, suggestions: ['0-2 years', '3-5 years', '6-10 years', '11+ years'] },
        { id: 'connections', label: 'Number of Connections', type: 'dropdown', icon: <Users className="w-3.5 h-3.5" />, suggestions: ['500+', '100-500', '0-100'] },
        { id: 'past-job-title', label: 'Past Job Title', type: 'dropdown', icon: <FileText className="w-3.5 h-3.5" /> },
    ];

    const INTENT_FILTERS: FilterConfig[] = [
        { id: 'size-growth', label: 'Company Size Growth (3m.)', type: 'dropdown', icon: <Activity className="w-3.5 h-3.5" />, suggestions: ['>10%', '0-10%', 'Negative'] },
        { id: 'is-hiring', label: 'Company is Hiring', type: 'checkbox', icon: <Briefcase className="w-3.5 h-3.5" /> },
        { id: 'technologies', label: 'Company Technologies', type: 'dropdown', icon: <Zap className="w-3.5 h-3.5" />, suggestions: ['React', 'Salesforce', 'Hubspot', 'AWS'] },
        { id: 'funding-date', label: 'Company Last Funding Date', type: 'dropdown', icon: <Banknote className="w-3.5 h-3.5" />, suggestions: ['Past 3 Months', 'Past 6 Months', 'Past Year'] },
        { id: 'revenue', label: 'Company Revenue', type: 'dropdown', icon: <Banknote className="w-3.5 h-3.5" />, suggestions: ['$0-$1M', '$1M-$10M', '$10M-$50M', '$50M+'] },
        { id: 'keyword-company', label: 'Keyword in Company', type: 'dropdown', icon: <Search className="w-3.5 h-3.5" /> },
    ];

    const COMPANY_FILTERS: FilterConfig[] = [
        { id: 'company-size', label: 'Company Size', type: 'dropdown', icon: <Users className="w-3.5 h-3.5" />, suggestions: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'] },
        { id: 'industry', label: 'Company Industry', type: 'dropdown', icon: <Factory className="w-3.5 h-3.5" />, suggestions: ['Software Development', 'Marketing Services', 'Financial Services', 'Hospital & Health Care', 'Higher Education', 'Information Technology', 'Telecommunications', 'Management Consulting', 'Retail', 'Real Estate', 'Logistics & Supply Chain', 'Pharmaceuticals', 'Construction', 'Automotive', 'Consumer Goods', 'Design services', 'Accounting'] },
        { id: 'market', label: 'Company Market', type: 'dropdown', icon: <Globe className="w-3.5 h-3.5" />, suggestions: ['B2B', 'B2C', 'Enterprise', 'SMB'] },
        { id: 'company-type', label: 'Company Type', type: 'dropdown', icon: <Building2 className="w-3.5 h-3.5" />, suggestions: ['Public Company', 'Privately Held', 'Non Profit', 'Educational Institution', 'Partnership', 'Self Employed', 'Government Agency'] },
        { id: 'company-name', label: 'Company Name', type: 'dropdown', icon: <Building2 className="w-3.5 h-3.5" /> },
        { id: 'founded-year', label: 'Company Founded Year', type: 'dropdown', icon: <Activity className="w-3.5 h-3.5" /> },
        { id: 'company-country', label: 'Company Country', type: 'dropdown', icon: <MapPin className="w-3.5 h-3.5" /> },
        { id: 'company-city', label: 'Company City/State', type: 'dropdown', icon: <MapPin className="w-3.5 h-3.5" /> },
        { id: 'company-linkedin', label: 'Company LinkedIn URL', type: 'dropdown', icon: <Globe className="w-3.5 h-3.5" /> },
        { id: 'company-website', label: 'Company Website URL', type: 'dropdown', icon: <Globe className="w-3.5 h-3.5" /> },
    ];

    const CONTACT_FILTERS: FilterConfig[] = [
        { id: 'full-name', label: 'Full Name', type: 'dropdown', icon: <Users className="w-3.5 h-3.5" /> },
        { id: 'lead-city', label: 'City/State', type: 'dropdown', icon: <MapPin className="w-3.5 h-3.5" /> },
        { id: 'interests', label: 'Interests', type: 'dropdown', icon: <Zap className="w-3.5 h-3.5" /> },
        { id: 'skills', label: 'Skills', type: 'dropdown', icon: <BadgeCheck className="w-3.5 h-3.5" />, suggestions: ['JavaScript', 'Sales', 'Marketing Strategy', 'Project Management', 'Business Analysis', 'Leadership', 'Java', 'Python', 'React', 'Node.js', 'SQL', 'Data Analysis', 'Customer Service', 'Public Speaking', 'Social Media Marketing', 'Business Development', 'Agile Methodologies', 'Cloud Computing', 'Salesforce'] },
        { id: 'school-name', label: 'School Name', type: 'dropdown', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'school-degree', label: 'School Degree', type: 'dropdown', icon: <FileText className="w-3.5 h-3.5" />, suggestions: ['Bachelor\'s', 'Master\'s', 'MBA', 'PhD', 'Associate\'s', 'Certificate', 'Diploma'] },
        { id: 'contact-linkedin', label: 'Contact LinkedIn URL', type: 'dropdown', icon: <Globe className="w-3.5 h-3.5" /> },
    ];

    // Helper to calculate total active filters for badge counters
    const countActive = (filters: FilterConfig[]) => {
        let count = 0;
        filters.forEach(f => {
            if (f.type === 'dropdown' && dropdownFilters[f.id] && dropdownFilters[f.id].length > 0) count++;
            if (f.type === 'checkbox' && checkboxFilters[f.id]) count++;
        });
        return count;
    };

    const hasAnyActiveFilter = countActive([...GENERAL_FILTERS, ...INTENT_FILTERS, ...COMPANY_FILTERS, ...CONTACT_FILTERS]) > 0;

    // ---------------------------------------------------------------------------
    // Debounced Search Execution
    // ---------------------------------------------------------------------------
    const executeSearch = useCallback(async () => {
        if (!hasAnyActiveFilter) {
            setLeads([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // We pass the unified filter payload.
            // Our backend will need to parse these exact arrays and logic flags into Unipile standard structure.
            const payload = {
                dropdowns: dropdownFilters,
                checkboxes: checkboxFilters
            }

            const res = await fetch('/api/unipile/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Search failed')
            }

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            if (data.leads && Array.isArray(data.leads)) {
                setLeads(data.leads)
            } else {
                setLeads([])
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during search.')
            setLeads([])
        } finally {
            setLoading(false)
        }
    }, [dropdownFilters, checkboxFilters, hasAnyActiveFilter])

    // Trigger search when any filter changes, with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            executeSearch()
        }, 1000) // 1000ms debounce allows user to add multiple filters quickly

        return () => clearTimeout(timer)
    }, [executeSearch])

    // ---------------------------------------------------------------------------
    // Select & Action Handlers
    // ---------------------------------------------------------------------------
    const toggleSelectAll = () => {
        if (selectedLeads.length === leads.length) setSelectedLeads([])
        else setSelectedLeads(leads.map((_, i) => i))
    }

    const toggleSelectLead = (index: number) => {
        if (selectedLeads.includes(index)) setSelectedLeads(selectedLeads.filter(i => i !== index))
        else setSelectedLeads([...selectedLeads, index])
    }

    // Main Render
    return (
        <div className="flex h-full w-full bg-slate-50 overflow-hidden text-slate-900 border-t border-slate-200">
            {/* Left Sidebar - Filters */}
            <div className="w-[340px] flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar flex flex-col">
                <div className="sticky top-0 bg-white/95 backdrop-blur z-20 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">Advanced Filters</span>
                    {hasAnyActiveFilter && (
                        <button
                            className="text-[11px] font-medium text-slate-500 hover:text-red-600 transition-colors"
                            onClick={() => { setDropdownFilters({}); setCheckboxFilters({}); }}
                        >
                            Reset
                        </button>
                    )}
                </div>

                <div className="p-4 flex flex-col gap-3">
                    <Accordion type="multiple" defaultValue={["item-general", "item-company"]} className="w-full flex w-full flex-col gap-3">

                        {/* 1. General Filters */}
                        <AccordionItem value="item-general" className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-3 px-4 hover:bg-slate-50 text-[14px] font-semibold text-slate-800 transition-colors">
                                <div className="flex items-center gap-2">
                                    Lemlist filters
                                    {countActive(GENERAL_FILTERS) > 0 && (
                                        <Badge className="ml-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] px-1.5 py-0 h-5 border-none">
                                            {countActive(GENERAL_FILTERS)}
                                        </Badge>
                                    )}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                                <FilterGroup
                                    filters={GENERAL_FILTERS}
                                    state={{ ...dropdownFilters, ...checkboxFilters }}
                                    onDropdownChange={handleDropdownChange}
                                    onCheckboxChange={handleCheckboxChange}
                                />
                            </AccordionContent>
                        </AccordionItem>

                        {/* 2. Signals & Intent */}
                        <AccordionItem value="item-intent" className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-3 px-4 hover:bg-slate-50 text-[14px] font-semibold text-slate-800 transition-colors">
                                <div className="flex items-center gap-2">
                                    Job title & experience
                                    {countActive(INTENT_FILTERS) > 0 && (
                                        <Badge className="ml-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] px-1.5 py-0 h-5 border-none">
                                            {countActive(INTENT_FILTERS)}
                                        </Badge>
                                    )}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                                <FilterGroup
                                    filters={INTENT_FILTERS}
                                    state={{ ...dropdownFilters, ...checkboxFilters }}
                                    onDropdownChange={handleDropdownChange}
                                    onCheckboxChange={handleCheckboxChange}
                                />
                            </AccordionContent>
                        </AccordionItem>

                        {/* 3. Company Information */}
                        <AccordionItem value="item-company" className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-3 px-4 hover:bg-slate-50 text-[14px] font-semibold text-slate-800 transition-colors">
                                <div className="flex items-center gap-2">
                                    Company
                                    {countActive(COMPANY_FILTERS) > 0 && (
                                        <Badge className="ml-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] px-1.5 py-0 h-5 border-none">
                                            {countActive(COMPANY_FILTERS)}
                                        </Badge>
                                    )}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                                <FilterGroup
                                    filters={COMPANY_FILTERS}
                                    state={{ ...dropdownFilters, ...checkboxFilters }}
                                    onDropdownChange={handleDropdownChange}
                                    onCheckboxChange={handleCheckboxChange}
                                />
                            </AccordionContent>
                        </AccordionItem>

                        {/* 4. Contact Information */}
                        <AccordionItem value="item-contact" className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                            <AccordionTrigger className="hover:no-underline py-3 px-4 hover:bg-slate-50 text-[14px] font-semibold text-slate-800 transition-colors">
                                <div className="flex items-center gap-2">
                                    Location
                                    {countActive(CONTACT_FILTERS) > 0 && (
                                        <Badge className="ml-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] px-1.5 py-0 h-5 border-none">
                                            {countActive(CONTACT_FILTERS)}
                                        </Badge>
                                    )}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                                <FilterGroup
                                    filters={CONTACT_FILTERS}
                                    state={{ ...dropdownFilters, ...checkboxFilters }}
                                    onDropdownChange={handleDropdownChange}
                                    onCheckboxChange={handleCheckboxChange}
                                />
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </div>
            </div>

            {/* Right Main Content - Table */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">

                {/* Header Action Bar */}
                <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white/95 backdrop-blur z-10 sticky top-0">
                    <div className="flex items-center gap-2">
                        {loading ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                Fetching leads...
                            </div>
                        ) : (
                            <div className="text-sm text-slate-600 flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{leads.length}</span> results found
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedLeads.length > 0 && (
                            <span className="text-sm text-slate-500 font-medium mr-2">
                                {selectedLeads.length} selected
                            </span>
                        )}
                        <Button variant="outline" size="sm" className="h-8 border-slate-200 text-xs shadow-none">
                            Export
                        </Button>
                        <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-xs" disabled={selectedLeads.length === 0}>
                            Add to Campaign
                        </Button>
                    </div>
                </div>

                {/* Main Table Area */}
                <div className="flex-1 overflow-auto p-0">
                    {error ? (
                        <div className="p-8 flex flex-col items-center justify-center text-center h-full text-slate-500 bg-slate-50/50">
                            <MonitorSmartphone className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Search Failed</h3>
                            <p className="max-w-md text-sm">{error}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="w-12 pl-6">
                                        <Checkbox
                                            checked={leads.length > 0 && selectedLeads.length === leads.length}
                                            onCheckedChange={toggleSelectAll}
                                            disabled={leads.length === 0 || loading}
                                        />
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 w-[240px]">Name</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 w-[100px]">Email</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 w-[100px]">Phone</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 w-[200px]">Company</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 w-[220px]">Job title</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Country</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500">Size</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && leads.length === 0 ? (
                                    // Skeleton Loading rows
                                    Array(8).fill(0).map((_, i) => (
                                        <TableRow key={i} className="border-none">
                                            <TableCell className="pl-6"><Skeleton className="w-4 h-4 rounded" /></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="w-8 h-8 rounded-full" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="w-5 h-5 rounded" />
                                                    <Skeleton className="h-4 w-24" />
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : leads.length === 0 && !loading ? (
                                    // Empty state
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-[400px] text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                                    <Search className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <h3 className="text-base font-semibold text-slate-800 mb-1">Add filters to uncover leads</h3>
                                                <p className="text-sm text-slate-500">You must add at least one filter on the left to begin searching.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    // Actual Data rows matching Lemlist screenshot exactly 
                                    leads.map((lead, index) => (
                                        <TableRow key={lead.id} className="group hover:bg-slate-50 cursor-pointer border-b border-slate-100" onClick={() => toggleSelectLead(index)}>
                                            <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedLeads.includes(index)}
                                                    onCheckedChange={() => toggleSelectLead(index)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {lead.image ? (
                                                        <img src={lead.image} alt="" className="w-8 h-8 rounded-full bg-slate-100 object-cover border border-slate-200" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono border border-primary/20">
                                                            {lead.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-slate-900 text-sm group-hover:text-primary transition-colors">{lead.name}</span>
                                                    {lead.linkedinUrl && (
                                                        <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="w-[18px] h-[18px] bg-[#0a66c2]/10 hover:bg-[#0a66c2]/20 rounded-sm flex items-center justify-center text-[#0a66c2] transition-colors ml-1" onClick={(e) => e.stopPropagation()} title="LinkedIn Profile">
                                                            <LinkedinLogo />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Mail className="w-4 h-4 text-primary" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Phone className="w-4 h-4 text-primary" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {lead.company && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-[18px] h-[18px] rounded-sm bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                            <Factory className="w-2.5 h-2.5 text-amber-600" />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 max-w-[150px] truncate" title={lead.company}>{lead.company}</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-600 max-w-[180px] truncate block" title={lead.title}>{lead.title}</span>
                                            </TableCell>
                                            <TableCell>
                                                {lead.location && (
                                                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="max-w-[120px] truncate" title={lead.location}>{lead.location}</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-500">1001+</span> {/* Stub from Unipile response mapping */}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    )
}

function LinkedinLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
    );
}
