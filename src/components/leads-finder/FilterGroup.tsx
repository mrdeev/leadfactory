import { FilterDropdown, FilterValue } from "./FilterDropdown";
import { Checkbox } from "@/components/ui/checkbox";

export interface FilterConfig {
    id: string;
    label: string;
    icon?: React.ReactNode;
    suggestions?: string[];
    type: 'dropdown' | 'checkbox';
}

interface FilterGroupProps {
    filters: FilterConfig[];
    state: Record<string, FilterValue[] | boolean>;
    onDropdownChange: (filterId: string, values: FilterValue[]) => void;
    onCheckboxChange: (filterId: string, checked: boolean) => void;
}

export function FilterGroup({ filters, state, onDropdownChange, onCheckboxChange }: FilterGroupProps) {
    return (
        <div className="px-2 pt-1 pb-4 flex flex-col gap-4">
            {filters.map((filter) => {
                if (filter.type === 'dropdown') {
                    // Safe access to state array
                    const values = (state[filter.id] as FilterValue[]) || [];
                    return (
                        <FilterDropdown
                            key={filter.id}
                            label={filter.label}
                            icon={filter.icon}
                            suggestions={filter.suggestions}
                            values={values}
                            onChange={(newValues) => onDropdownChange(filter.id, newValues)}
                        />
                    );
                }

                if (filter.type === 'checkbox') {
                    // Safe access to boolean state
                    const isChecked = !!state[filter.id];
                    return (
                        <div key={filter.id} className="flex flex-col gap-1.5 px-[5px]">
                            <label className="flex items-center gap-2 text-[14px] font-medium text-slate-600 cursor-pointer group py-1.5">
                                <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(c) => onCheckboxChange(filter.id, !!c)}
                                    className="w-4 h-4 border-slate-300 rounded text-primary focus:ring-primary"
                                />
                                {filter.icon && <span className="opacity-70 group-hover:opacity-100">{filter.icon}</span>}
                                <span className="group-hover:text-slate-900 transition-colors">{filter.label}</span>
                            </label>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}
