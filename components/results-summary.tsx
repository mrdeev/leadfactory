"use client";

import { Users, Linkedin, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ResultsSummaryProps {
  totalLeads: number;
  leadsWithLinkedIn: number;
  leadsWithEmail: number;
  leadsWithPhone: number;
}

const stats = [
  { key: "totalLeads", label: "Total Leads", icon: Users, color: "text-primary" },
  {
    key: "leadsWithLinkedIn",
    label: "With LinkedIn",
    icon: Linkedin,
    color: "text-sky-500",
  },
  {
    key: "leadsWithEmail",
    label: "With Email",
    icon: Mail,
    color: "text-emerald-500",
  },
  {
    key: "leadsWithPhone",
    label: "With Phone",
    icon: Phone,
    color: "text-amber-500",
  },
] as const;

export function ResultsSummary(props: ResultsSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = props[stat.key];

        return (
          <Card
            key={stat.key}
            className="border-0 bg-muted/50 transition-colors hover:bg-muted/70"
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
