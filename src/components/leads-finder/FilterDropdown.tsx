import { useState, useRef, useEffect } from "react";
import { Plus, Minus, Search, X, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FilterValue = {
    value: string;
    type: 'include' | 'exclude';
};

interface FilterDropdownProps {
    label: string;
    icon?: React.ReactNode;
    values: FilterValue[];
    onChange: (values: FilterValue[]) => void;
    placeholder?: string;
    suggestions?: string[];
}

export function FilterDropdown({ label, icon, values, onChange, placeholder = "Add", suggestions = [] }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAdd = (type: 'include' | 'exclude', val: string = inputValue) => {
        const trimmed = val.trim();
        if (!trimmed) return;

        // Prevent duplicates
        if (!values.find(v => v.value.toLowerCase() === trimmed.toLowerCase())) {
            onChange([...values, { value: trimmed, type }]);
        }
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd('include'); // Default to include on Enter
        }
    };

    const handleRemove = (valueToRemove: string) => {
        onChange(values.filter(v => v.value !== valueToRemove));
    };

    const filteredSuggestions = suggestions
        .filter(s =>
            s.toLowerCase().includes(inputValue.toLowerCase()) &&
            !values.find(v => v.value.toLowerCase() === s.toLowerCase())
        )
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 50); // Show more suggestions since it's displayed alphabetically by default

    return (
        <div className="flex flex-col gap-1.5" ref={dropdownRef}>
            {/* Filter Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left py-2 px-[5px] border border-slate-200 rounded-md bg-white hover:border-primary/20 hover:bg-primary/5 group transition-all"
            >
                <div className="flex items-center gap-3 text-[14px] font-medium text-slate-700 group-hover:text-primary transition-colors">
                    {icon && <span className="opacity-70 group-hover:opacity-100 flex items-center justify-center pl-1 text-slate-500 group-hover:text-primary">{icon}</span>}
                    {label}
                </div>
                <div className="flex items-center gap-2">
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 group-hover:text-primary transition-transform", isOpen ? "rotate-180" : "")} />
                </div>
            </button>

            {/* Selected Values Badges */}
            {values.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                    {values.map((v) => (
                        <Badge
                            key={v.value}
                            variant="secondary"
                            className={cn(
                                "text-[11px] font-normal py-0.5 pr-1 pl-2 gap-1 border border-transparent",
                                v.type === 'include'
                                    ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                                    : "bg-red-50 text-red-700 hover:bg-red-100 border-red-100 line-through decoration-red-300"
                            )}
                        >
                            {v.value}
                            <div
                                onClick={(e) => { e.stopPropagation(); handleRemove(v.value); }}
                                className={cn(
                                    "rounded-full p-0.5 cursor-pointer flex items-center justify-center transition-colors",
                                    v.type === 'include' ? "hover:bg-primary/20" : "hover:bg-red-200"
                                )}
                            >
                                <X className="w-2.5 h-2.5" />
                            </div>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Input Dropdown */}
            {isOpen && (
                <div className="relative z-20 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="relative flex items-center border border-primary/20 rounded-md bg-white shadow-sm ring-2 ring-primary/5 overflow-hidden">
                        <Input
                            autoFocus
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm pl-2 pr-14"
                        />
                        <div className="absolute right-1 flex items-center gap-0.5">
                            <button
                                onClick={() => handleAdd('include')}
                                disabled={!inputValue.trim()}
                                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-primary hover:bg-primary/5 disabled:opacity-50 transition-colors"
                                title="Include"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleAdd('exclude')}
                                disabled={!inputValue.trim()}
                                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                title="Exclude"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Suggestions Box */}
                    {filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-y-auto max-h-60 flex flex-col p-1 z-30">
                            {filteredSuggestions.map(suggestion => (
                                <div key={suggestion} className="flex items-center justify-between px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer rounded-sm group">
                                    <span className="truncate">{suggestion}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); handleAdd('include', suggestion); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary/10 text-primary"><Plus className="w-3.5 h-3.5" /></button>
                                        <div className="w-px h-3 bg-slate-200"></div>
                                        <button onClick={(e) => { e.stopPropagation(); handleAdd('exclude', suggestion); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 text-red-600"><Minus className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
