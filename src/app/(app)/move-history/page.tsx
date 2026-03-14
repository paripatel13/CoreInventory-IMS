"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getCollection } from "../../../lib/firebase/firestore";
import Topbar from "../../../components/layout/Topbar";
import { formatDate } from "../../../lib/utils/formatDate";
 import {  Badge} from "../../../components/ui/index";
const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const TYPE_COLORS: Record<string, string> = {
  receipt: "bg-green-50 text-green-700 border-green-200",
  delivery: "bg-blue-50 text-blue-700 border-blue-200",
  transfer: "bg-purple-50 text-purple-700 border-purple-200",
  adjustment: "bg-amber-50 text-amber-700 border-amber-200",
};

type Receipt = {
  id: string;
  supplier: string;
  items?: { [key: string]: unknown }[];
  createdAt: { seconds?: number; toDate?: () => Date } | Date;
  [key: string]: unknown;
};

type Delivery = {
  id: string;
  customer: string;
  items?: { [key: string]: unknown }[];
  createdAt: { seconds?: number; toDate?: () => Date } | Date;
  [key: string]: unknown;
};

type Transfer = {
  id: string;
  fromLocation: string;
  toLocation: string;
  items?: { [key: string]: unknown }[];
  createdAt: { seconds?: number; toDate?: () => Date } | Date;
  [key: string]: unknown;
};

type Adjustment = {
  id: string;
  productName: string;
  delta?: number;
  reason?: string;
  createdAt: { seconds?: number; toDate?: () => Date } | Date;
  [key: string]: unknown;
};

type HistoryItem = {
  id: string;
  type: keyof typeof TYPE_COLORS;
  label: string;
  items?: { [key: string]: unknown }[];
  delta?: number;
  status?: string;
  reason?: string;
  createdAt: { seconds?: number; toDate?: () => Date } | Date;
  [key: string]: unknown;
};

export default function MoveHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [receipts, deliveries, transfers, adjustments] = await Promise.all([
        getCollection("receipts"), getCollection("deliveries"),
        getCollection("transfers"), getCollection("adjustments"),
      ]);
      function hasSeconds(obj: unknown): obj is { seconds: number } {
        return typeof obj === "object" && obj !== null && "seconds" in obj && typeof (obj as { seconds: unknown }).seconds === "number";
      }
      function hasToDate(obj: unknown): obj is { toDate: () => Date } {
        return typeof obj === "object" && obj !== null && "toDate" in obj && typeof (obj as { toDate: unknown }).toDate === "function";
      }
      function getTimestamp(createdAt: { seconds?: number; toDate?: () => Date } | Date) {
        if (hasSeconds(createdAt)) {
          return createdAt.seconds;
        }
        if (hasToDate(createdAt)) {
          return createdAt.toDate().getTime() / 1000;
        }
        if (createdAt instanceof Date) {
          return createdAt.getTime() / 1000;
        }
        return 0;
      }

      const all = [
        ...(receipts as Receipt[]).map((r) => ({ ...r, type: "receipt", label: r.supplier })),
        ...(deliveries as Delivery[]).map((d) => ({ ...d, type: "delivery", label: d.customer })),
        ...(transfers as Transfer[]).map((t) => ({ ...t, type: "transfer", label: `${t.fromLocation} → ${t.toLocation}` })),
        ...(adjustments as Adjustment[]).map((a) => ({ ...a, type: "adjustment", label: a.productName })),
      ].sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
      setHistory(all);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex-1">
      <Topbar title="Move History" />
      <div className="p-6 space-y-5">
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <p className="text-slate-400 text-sm">No history yet.</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show"
            className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Type", "Reference", "Items", "Status / Delta", "Date"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <motion.tr key={h.id} variants={item} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={TYPE_COLORS[h.type] ?? ""}>{h.type}</Badge>
                      </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">{h.label}</td>
                      <td className="px-5 py-3.5 text-slate-500">
  {h.items
    ? `${h.items.length} item(s)`
    : `Δ ${(h.delta ?? 0) >= 0 ? "+" : ""}${h.delta ?? 0}`}
</td>
<td className="px-5 py-3.5 text-slate-500">
  {(h.status as string) ?? (h.reason as string) ?? "—"}
</td>
<td className="px-5 py-3.5 text-slate-400 text-xs">
  {formatDate(
    typeof h.createdAt === "object" && h.createdAt !== null && "toDate" in h.createdAt
      ? (h.createdAt as { toDate: () => Date }).toDate()
      : (h.createdAt as Date)
  )}
</td>

                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
	