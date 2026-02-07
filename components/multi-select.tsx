"use client";

import * as React from "react";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query) return [...options];
    const lower = query.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lower));
  }, [options, query]);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeItem = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-[2.5rem] w-full justify-between px-3 py-1.5 font-normal"
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selected.slice(0, maxDisplay).map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="gap-1 rounded-md px-1.5 py-0 text-xs font-normal"
              >
                {item}
                <button
                  className="ml-0.5 rounded-full outline-none ring-offset-background hover:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => removeItem(item, e)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selected.length > maxDisplay && (
              <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-xs font-normal">
                +{selected.length - maxDisplay} more
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="border-b px-3 py-2">
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="scrollbar-thin max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              No results found.
            </p>
          )}
          {filtered.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                  isSelected && "bg-accent/50"
                )}
                onClick={() => toggle(option)}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                {option}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div className="border-t px-3 py-2">
            <button
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onChange([])}
            >
              Clear all ({selected.length})
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
