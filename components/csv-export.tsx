"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import type { LeadResult } from "@/lib/types";

interface CsvExportProps {
  leads: LeadResult[];
}

export function CsvExport({ leads }: CsvExportProps) {
  const handleExport = () => {
    const rows = leads.map((lead) => ({
      Name: lead.full_name,
      Title: lead.position,
      Company: lead.org_name,
      Industry: lead.org_industry,
      Email: lead.email,
      "Email Status": lead.email_status,
      Phone: lead.phone,
      City: lead.city,
      State: lead.state,
      Country: lead.country,
      LinkedIn: lead.linkedin_url,
      "Company Website": lead.org_website,
      "Company Size": lead.org_size,
      "Generated Email": lead.generated_email?.email_body || "",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (leads.length === 0) return null;

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Download CSV
    </Button>
  );
}
