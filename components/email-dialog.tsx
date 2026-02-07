"use client";

import * as React from "react";
import { Copy, Check, Building2, Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { LeadResult } from "@/lib/types";

interface EmailDialogProps {
  lead: LeadResult | null;
  open: boolean;
  onClose: () => void;
}

export function EmailDialog({ lead, open, onClose }: EmailDialogProps) {
  const [copied, setCopied] = React.useState(false);

  const emailBody = lead?.generated_email?.email_body || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Generated Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-sm font-semibold">
                {lead.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium">{lead.full_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {lead.position && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal">
                    <Briefcase className="h-3 w-3" />
                    {lead.position}
                  </Badge>
                )}
                {lead.org_name && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal">
                    <Building2 className="h-3 w-3" />
                    {lead.org_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border bg-card p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {emailBody}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>

          {lead.linkedin_posts && lead.linkedin_posts.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  LinkedIn Context Used
                </p>
                {lead.linkedin_posts.slice(0, 2).map((post, i) => (
                  <div
                    key={post.id || i}
                    className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground"
                  >
                    {post.post_content.slice(0, 200)}
                    {post.post_content.length > 200 && "..."}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
