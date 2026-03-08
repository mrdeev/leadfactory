"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Search, SlidersHorizontal, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import { industries } from "./industries"
import { jobTitles as jobTitlesList } from "./jobTitles"
import { MultiSelect } from "./MultiSelect"

const formSchema = z.object({
    industry: z.array(z.string()).min(1, {
        message: "At least one industry is required.",
    }),
    location: z.string(),
    jobTitles: z.array(z.string()).min(1, {
        message: "At least one job title is required.",
    }),
    // Advanced
    keywords: z.string(),
    companySize: z.string(),
    emailStatus: z.enum(["Verified", "Unverified", "All"]),
    hasEmail: z.boolean(),
    hasPhone: z.boolean(),
    maxResults: z.number().min(1).max(50000),
})

export function SearchForm({ onSearch, isLoading }: { onSearch: (values: z.infer<typeof formSchema>) => void, isLoading: boolean }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            industry: [],
            location: "",
            jobTitles: [],
            keywords: "",
            companySize: "",
            emailStatus: "Verified",
            hasEmail: true,
            hasPhone: false,
            maxResults: 10,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        onSearch(values)
    }

    const jobTitleOptions = jobTitlesList.map(title => ({
        label: title,
        value: title
    }))

    const industryOptions = industries.map(ind => ({
        label: ind,
        value: ind
    }))

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Industry</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={industryOptions}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select industries..."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="City, State or Country" {...field} className="bg-white border-slate-200 h-10" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="jobTitles"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Job Titles</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={jobTitleOptions}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select job titles..."
                                    />
                                </FormControl>
                                <FormDescription>Select titles from the allowed list.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" type="button">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Advanced Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[400px] sm:w-[540px] overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Advanced Filters</SheetTitle>
                                <SheetDescription>
                                    Refine your search with granular controls.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="grid gap-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="keywords"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Keywords</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. SaaS, AI, B2B" {...field} className="bg-white border-slate-200 h-10" />
                                            </FormControl>
                                            <FormDescription>Keywords in company description/name.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companySize"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Size</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white border-slate-200 h-10">
                                                        <SelectValue placeholder="Select size" />
                                                    </SelectTrigger>
                                                </FormControl>
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="emailStatus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white border-slate-200 h-10">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Verified">Verified Only</SelectItem>
                                                    <SelectItem value="Unverified">Unverified</SelectItem>
                                                    <SelectItem value="All">All</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex items-center gap-8">
                                    <FormField
                                        control={form.control}
                                        name="hasEmail"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 w-full bg-white">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Must Have Email</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="hasPhone"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 w-full bg-white">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Must Have Phone</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="maxResults"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Results</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Max leads (default 10)"
                                                    {...field}
                                                    onChange={e => field.onChange(e.target.valueAsNumber)}
                                                />
                                            </FormControl>
                                            <FormDescription>Max leads to fetch (Max 50k).</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <SheetFooter>
                                <SheetClose asChild>
                                    <Button type="button">Save Filters</Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>

                    <Button type="submit" disabled={isLoading} variant="gradient" className="w-full md:w-auto min-w-[200px]">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Finding Leads...
                            </>
                        ) : (
                            <>
                                <Search className="mr-2 h-4 w-4" />
                                Find Leads
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
