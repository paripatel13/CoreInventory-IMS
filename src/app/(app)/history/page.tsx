"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getCollection } from "../../../lib/firebase/firestore";
import Topbar from "../../../components/layout/Topbar";
import { Badge } from "../../../components/ui/index";
import FilterBar from "../../../components/ui/FilterBar";
import { ROUTES } from "../../../constants/routes";
import { STATUS_COLORS } from "../../../constants/status";
import { formatDate } from "../../../lib/utils/formatDate";

interface HistoryItem {
  id: string;
  type: "receipt" | "delivery" | "transfer" | "adjustment";
  label: string;
  sublabel?: string;
  status?: string;
  delta?: number;
  createdAt: unknown;
}

const TYPE_COLORS: Record<string, string> = {
  receipt: "bg-green-50 text-green-700 border-green-200",
  delivery: "bg-blue-50 text-blue-700 border-blue-200",
  transfer: "bg-purple-50 text-purple-700 border-purple-200",
  adjustment: "bg-amber-50 text-amber-700 border-amber-200",
};

const TYPE_LABELS: Record<string, string> = {
  receipt: "Receipt",
  delivery: "Delivery",
  transfer: "Transfer",
  adjustment: "Adjustment",
};

function safeSeconds(val: unknown): number {
  if (!val) return 0;
  if (typeof val === "object" && val !== null && "seconds" in val)
    return (val as { seconds: number }).seconds;
  if (typeof val === "object" && val !== null && "toDate" in val)
    return (val as { toDate: () => Date }).toDate().getTime() / 1000;
  return 0;
}

function safeDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === "object" && val !== null && "toDate" in val)
    return (val as { toDate: () => Date }).toDate();
  if (val instanceof Date) return val;
  return null;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function load() {
      const [receipts, deliveries, transfers, adjustments] = await Promise.all([
        getCollection("receipts"),
        getCollection("deliveries"),
        getCollection("transfers"),
        getCollection("adjustments"),
      ]);

      const all: HistoryItem[] = [
        ...(receipts as {
          id: string; supplier: string; status: string;
          warehouseName?: string; items: unknown[]; createdAt: unknown;
        }[]).map((r) => ({
          id: r.id,
          type: "receipt" as const,
          label: `Receipt from ${r.supplier}`,
          sublabel: `${r.items?.length ?? 0} item(s)${r.warehouseName ? ` · ${r.warehouseName}` : ""}`,
          status: r.status,
          createdAt: r.createdAt,
        })),

        ...(deliveries as {
          id: string; customer: string; status: string;
          warehouseName?: string; items: unknown[]; createdAt: unknown;
        }[]).map((d) => ({
          id: d.id,
          type: "delivery" as const,
          label: `Delivery to ${d.customer}`,
          sublabel: `${d.items?.length ?? 0} item(s)${d.warehouseName ? ` · ${d.warehouseName}` : ""}`,
          status: d.status,
          createdAt: d.createdAt,
        })),

        ...(transfers as {
          id: string; fromWarehouseName?: string; fromLocation?: string;
          toWarehouseName?: string; toLocation?: string;
          status: string; items: unknown[]; createdAt: unknown;
        }[]).map((t) => ({
          id: t.id,
          type: "transfer" as const,
          label: `${t.fromWarehouseName ?? t.fromLocation ?? "?"} → ${t.toWarehouseName ?? t.toLocation ?? "?"}`,
          sublabel: `${t.items?.length ?? 0} item(s)`,
          status: t.status,
          createdAt: t.createdAt,
        })),

        ...(adjustments as {
          id: string; productName: string; locationName?: string;
          locationId?: string; delta?: number; reason?: string; createdAt: unknown;
        }[]).map((a) => ({
          id: a.id,
          type: "adjustment" as const,
          label: `Adjustment: ${a.productName}`,
          sublabel: `${a.locationName ?? a.locationId ?? ""}${a.reason ? ` · ${a.reason}` : ""}`,
          delta: a.delta,
          createdAt: a.createdAt,
        })),
      ].sort((a, b) => safeSeconds(b.createdAt) - safeSeconds(a.createdAt));

      setHistory(all);
      setLoading(false);
    }
    load();
  }, []);

  const allStatuses = [...new Set(
    history.filter((h) => h.status).map((h) => h.status!)
  )];

  const filtered = history.filter((h) => {
    const matchSearch = !search ||
      h.label.toLowerCase().includes(search.toLowerCase()) ||
      (h.sublabel ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || h.type === typeFilter;
    const matchStatus = !statusFilter || h.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  function getHref(item: HistoryItem): string {
    switch (item.type) {
      case "receipt": return ROUTES.RECEIPTS;
      case "delivery": return ROUTES.DELIVERIES;
      case "transfer": return ROUTES.TRANSFERS;
      case "adjustment": return ROUTES.ADJUSTMENTS;
    }
  }

  return (
    <div className="flex-1">
      <Topbar title="History" />
      <div className="p-6 space-y-4">

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search any operation..."
            filters={[
              {
                key: "type",
                label: "Type",
                value: typeFilter,
                onChange: setTypeFilter,
                options: [
                  { label: "Receipts", value: "receipt" },
                  { label: "Deliveries", value: "delivery" },
                  { label: "Transfers", value: "transfer" },
                  { label: "Adjustments", value: "adjustment" },
                ],
              },
              {
                key: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: allStatuses.map((s) => ({ label: s, value: s })),
              },
            ]}
          />
          <p className="text-xs text-slate-400">
            {filtered.length} of {history.length} operations
          </p>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-16 text-center">
            <p className="text-slate-400 text-sm">No operations match your filters.</p>
          </div>
        ) : (
          <motion.div
            variants={container} initial="hidden" animate="show"
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map((h) => (
                <motion.div
                  key={`${h.type}-${h.id}`}
                  variants={item}
                  onClick={() => router.push(getHref(h))}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  {/* Type badge */}
                  <Badge
                    variant="outline"
                    className={`${TYPE_COLORS[h.type]} shrink-0 w-24 justify-center`}
                  >
                    {TYPE_LABELS[h.type]}
                  </Badge>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {h.label}
                    </p>
                    {h.sublabel && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {h.sublabel}
                      </p>
                    )}
                  </div>

                  {/* Delta for adjustments */}
                  {h.type === "adjustment" && h.delta !== undefined && (
                    <span className={`text-sm font-bold shrink-0 ${
                      h.delta > 0 ? "text-green-600"
                      : h.delta < 0 ? "text-red-500"
                      : "text-slate-400"
                    }`}>
                      {h.delta > 0 ? `+${h.delta}` : h.delta}
                    </span>
                  )}

                  {/* Status */}
                  {h.status && (
                    <Badge
                      variant="outline"
                      className={`${(STATUS_COLORS as Record<string, string>)[h.status!] ?? ""} shrink-0 text-xs`}
                    >
                      {h.status}
                    </Badge>
                  )}

                  {/* Date */}
                  <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
                    {formatDate(safeDate(h.createdAt))}
                  </span>

                  <span className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors text-sm shrink-0">
                    →
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}