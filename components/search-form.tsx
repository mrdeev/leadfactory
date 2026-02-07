"use client";

import * as React from "react";
import {
  Search,
  SlidersHorizontal,
  Loader2,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/multi-select";
import {
  INDUSTRIES,
  JOB_TITLES,
  COMPANY_SIZES,
  EMAIL_STATUS_OPTIONS,
} from "@/lib/constants";
import type { FormValues } from "@/lib/types";

interface SearchFormProps {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
}

const DEFAULT_VALUES: FormValues = {
  industries: [],
  location: "",
  jobTitles: [],
  companyKeywords: "",
  companySizes: [],
  emailStatus: "all",
  hasEmail: false,
  hasPhone: false,
  maxResults: 10,
};

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [values, setValues] = React.useState<FormValues>(DEFAULT_VALUES);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  const advancedFilterCount = React.useMemo(() => {
    let count = 0;
    if (values.companyKeywords.trim()) count++;
    if (values.companySizes.length > 0) count++;
    if (values.emailStatus !== "all") count++;
    if (values.hasEmail) count++;
    if (values.hasPhone) count++;
    if (values.maxResults !== 10) count++;
    return count;
  }, [values]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Find B2B Leads</h2>
              <p className="text-sm text-muted-foreground">
                Set your targeting criteria and discover qualified leads
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Industry</Label>
              <MultiSelect
                options={INDUSTRIES}
                selected={values.industries}
                onChange={(v) => update("industries", v)}
                placeholder="Select industries..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Location (City)</Label>
              <Input
                placeholder="e.g. Austin, San Francisco"
                value={values.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-sm font-medium">Target Job Titles</Label>
              <MultiSelect
                options={JOB_TITLES}
                selected={values.jobTitles}
                onChange={(v) => update("jobTitles", v)}
                placeholder="Select job titles..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Sheet open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Advanced Filters
                  {advancedFilterCount > 0 && (
                    <Badge className="ml-1 h-5 min-w-[1.25rem] rounded-full px-1.5 text-xs">
                      {advancedFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>
                    Fine-tune your search to find the most relevant leads
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Company Keywords</Label>
                    <Input
                      placeholder="e.g. SaaS, AI, automation"
                      value={values.companyKeywords}
                      onChange={(e) => update("companyKeywords", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Searches company name, description, and specialties
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Company Size</Label>
                    <MultiSelect
                      options={COMPANY_SIZES}
                      selected={values.companySizes}
                      onChange={(v) => update("companySizes", v)}
                      placeholder="Select employee ranges..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email Status</Label>
                    <Select
                      value={values.emailStatus}
                      onValueChange={(v) => update("emailStatus", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="has-email" className="text-sm font-medium">
                          Must Have Email
                        </Label>
                      </div>
                      <Switch
                        id="has-email"
                        checked={values.hasEmail}
                        onCheckedChange={(v) => update("hasEmail", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="has-phone" className="text-sm font-medium">
                          Must Have Phone
                        </Label>
                      </div>
                      <Switch
                        id="has-phone"
                        checked={values.hasPhone}
                        onCheckedChange={(v) => update("hasPhone", v)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Results</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50000}
                      value={values.maxResults}
                      onChange={(e) =>
                        update("maxResults", Math.max(1, parseInt(e.target.value) || 10))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of leads to return (1 - 50,000)
                    </p>
                  </div>
                </div>

                <SheetFooter className="mt-8 flex-row gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setValues((prev) => ({
                        ...prev,
                        companyKeywords: "",
                        companySizes: [],
                        emailStatus: "all",
                        hasEmail: false,
                        hasPhone: false,
                        maxResults: 10,
                      }));
                    }}
                  >
                    Reset Filters
                  </Button>
                  <SheetClose asChild>
                    <Button size="sm">Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2 px-8"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Find Leads
                </>
              )}
            </Button>
          </div>

          {(values.industries.length > 0 ||
            values.jobTitles.length > 0 ||
            values.location) && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Active:</span>
              {values.industries.map((ind) => (
                <Badge key={ind} variant="secondary" className="gap-1 text-xs">
                  {ind}
                  <button onClick={() => update("industries", values.industries.filter((i) => i !== ind))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {values.jobTitles.map((title) => (
                <Badge key={title} variant="secondary" className="gap-1 text-xs">
                  {title}
                  <button onClick={() => update("jobTitles", values.jobTitles.filter((t) => t !== title))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {values.location && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {values.location}
                  <button onClick={() => update("location", "")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
