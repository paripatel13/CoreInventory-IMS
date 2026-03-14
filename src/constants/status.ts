export const STATUS = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  CANCELED: "Canceled",
} as const;

// Must be Record<string, string> — NOT a mapped const type
export const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Done: "bg-green-50 text-green-700 border-green-200",
  Canceled: "bg-red-50 text-red-600 border-red-200",
};