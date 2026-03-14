export const STATUS = {
  DRAFT: "Draft",
  WAITING: "Waiting",
  READY: "Ready",
  DONE: "Done",
  CANCELED: "Canceled",
} as const;

export type StatusType = (typeof STATUS)[keyof typeof STATUS];

export const STATUS_COLORS: Record<StatusType, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Waiting: "bg-yellow-100 text-yellow-700",
  Ready: "bg-blue-100 text-blue-700",
  Done: "bg-green-100 text-green-700",
  Canceled: "bg-red-100 text-red-600",
};
