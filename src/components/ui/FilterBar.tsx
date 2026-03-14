"use client";
interface FilterOption { label: string; value: string; }

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (val: string) => void;
  }[];
  search?: string;
  onSearch?: (val: string) => void;
  searchPlaceholder?: string;
}

export default function FilterBar({ filters, search, onSearch, searchPlaceholder }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {onSearch !== undefined && (
        <input
          type="text"
          placeholder={searchPlaceholder ?? "Search..."}
          value={search ?? ""}
          onChange={(e) => onSearch(e.target.value)}
          className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 w-48"
        />
      )}
      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="h-9 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
        >
          <option value="">{f.label}: All</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
}