"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useProduct } from "@/components/product-context";

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddProductDialog({ open, onClose }: AddProductDialogProps) {
  const router = useRouter();
  const { refreshProducts, setSelectedProduct } = useProduct();
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    website_url: "",
    industry: "",
    description: "",
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: form.name.trim(),
        website_url: form.website_url.trim(),
        industry: form.industry.trim(),
        description: form.description.trim(),
        wizard_completed: false,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast.error("Failed to create product");
      return;
    }

    toast.success(`${form.name} created`);
    setForm({ name: "", website_url: "", industry: "", description: "" });
    await refreshProducts();
    setSelectedProduct(data);
    onClose();

    router.push(`/products/${data.id}/wizard`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="My Awesome Product"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Website URL</Label>
            <Input
              placeholder="https://example.com"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Industry</Label>
            <Input
              placeholder="SaaS, E-commerce, etc."
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              placeholder="Brief description of your product..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Create Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
