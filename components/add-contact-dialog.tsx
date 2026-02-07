"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ContactStage } from "@/lib/types";

const STAGES: { value: ContactStage; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

interface AddContactDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  company: string;
  industry: string;
  linkedin_url: string;
  city: string;
  stage: ContactStage;
}

const INITIAL: FormState = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  company: "",
  industry: "",
  linkedin_url: "",
  city: "",
  stage: "new",
};

export function AddContactDialog({ open, onClose, onAdded }: AddContactDialogProps) {
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError("");

    const { error: dbError } = await supabase.from("contacts").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      position: form.position.trim(),
      company: form.company.trim(),
      industry: form.industry.trim(),
      linkedin_url: form.linkedin_url.trim(),
      city: form.city.trim(),
      stage: form.stage,
      source: "manual",
      score: 0,
      tags: [],
    });

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setForm(INITIAL);
    onAdded();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Full Name *</Label>
            <Input
              placeholder="John Doe"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phone</Label>
              <Input
                placeholder="+1 555 0100"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Job Title</Label>
              <Input
                placeholder="CEO"
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Company</Label>
              <Input
                placeholder="Acme Inc"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Industry</Label>
              <Input
                placeholder="Technology"
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Stage</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => update("stage", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">LinkedIn URL</Label>
              <Input
                placeholder="https://linkedin.com/in/..."
                value={form.linkedin_url}
                onChange={(e) => update("linkedin_url", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">City</Label>
              <Input
                placeholder="San Francisco"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Add Contact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
