"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useAdjustments } from "../../../../hooks/useAdjustments";
import { useProducts } from "../../../../hooks/useProducts";
import { useWarehouses } from "../../../../hooks/useWarehouses";
import Topbar from "../../../../components/layout/Topbar";
import { Button, Badge } from "../../../../components/ui/index";
import FilterBar from "../../../../components/ui/FilterBar";
import { ROUTES } from "../../../../constants/routes";
import { formatDate } from "../../../../lib/utils/formatDate";

function safeDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === "object" && val !== null && "toDate" in val)
    return (val as { toDate: () => Date }).toDate();
  if (val instanceof Date) return val;
  return null;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function AdjustmentsPage() {
  const { adjustments, loading } = useAdjustments();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();

  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [deltaFilter, setDeltaFilter] = useState("");

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const filtered = (adjustments as {
    id: string;
    productName?: string;
    warehouseId?: string;
    warehouseName?: string;
    locationId?: string;
    locationName?: string;
    previousQty?: number;
    countedQty?: number;
    delta?: number;
    reason?: string;
    createdAt?: unknown;
  }[]).filter((a) => {
    const matchSearch =
      !search ||
      (a.productName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.locationName ?? a.locationId ?? "").toLowerCase().includes(search.toLowerCase());
    const matchWarehouse =
      !warehouseFilter || (a.warehouseId ?? "") === warehouseFilter;
    const matchDelta =
      !deltaFilter ||
      (deltaFilter === "positive" && (a.delta ?? 0) > 0) ||
      (deltaFilter === "negative" && (a.delta ?? 0) < 0);
    return matchSearch && matchWarehouse && matchDelta;
  });

  return (
    <div className="flex-1">
      <Topbar title="Adjustments" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search product or location..."
            filters={[
              {
                key: "warehouse",
                label: "Warehouse",
                value: warehouseFilter,
                onChange: setWarehouseFilter,
                options: warehouses.map((w) => ({ label: w.name, value: w.id })),
              },
              {
                key: "delta",
                label: "Type",
                value: deltaFilter,
                onChange: setDeltaFilter,
                options: [
                  { label: "Stock Added (+)", value: "positive" },
                  { label: "Stock Removed (−)", value: "negative" },
                ],
              },
            ]}
          />
          <Link href={ROUTES.ADJUSTMENT_NEW}>
            <Button className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700 gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Adjustment
            </Button>
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          {filtered.length} of {adjustments.length} adjustments
        </p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <p className="text-slate-400 text-sm">No adjustments match your filters.</p>
          </div>
        ) : (
          <motion.div
            variants={container} initial="hidden" animate="show"
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {["Product", "Location", "Before", "After", "Delta", "Reason", "Date"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const delta = a.delta ?? 0;
                    return (
                      <motion.tr
                        key={a.id} variants={item}
                        className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                          {a.productName ?? "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                          {a.locationName ?? a.locationId ?? "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                          {a.previousQty ?? 0}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                          {a.countedQty ?? 0}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant="outline"
                            className={
                              delta > 0
                                ? "bg-green-50 text-green-700 border-green-200"
                                : delta < 0
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs max-w-[160px] truncate">
                          {a.reason ?? "—"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs">
                          {formatDate(safeDate(a.createdAt))}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}