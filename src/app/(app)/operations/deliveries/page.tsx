"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useDeliveries } from "../../../../hooks/useDeliveries";
import { useWarehouses } from "../../../../hooks/useWarehouses";
import Topbar from "../../../../components/layout/Topbar";
import { Button, Badge } from "../../../../components/ui/index";
import FilterBar from "../../../../components/ui/FilterBar";
import { ROUTES } from "../../../../constants/routes";
import { STATUS_COLORS } from "../../../../constants/status";
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

export default function DeliveriesPage() {
  const { deliveries, loading } = useDeliveries();
  const { warehouses } = useWarehouses();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");

  const filtered = deliveries.filter((d) => {
    const matchSearch = !search || d.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || d.status === statusFilter;
    const matchWarehouse = !warehouseFilter || d.warehouseId === warehouseFilter;
    return matchSearch && matchStatus && matchWarehouse;
  });

  const statuses = [...new Set(deliveries.map((d) => d.status))];

  return (
    <div className="flex-1">
      <Topbar title="Deliveries" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search customer..."
            filters={[
              {
                key: "status", label: "Status",
                value: statusFilter, onChange: setStatusFilter,
                options: statuses.map((s) => ({ label: s, value: s })),
              },
              {
                key: "warehouse", label: "Warehouse",
                value: warehouseFilter, onChange: setWarehouseFilter,
                options: warehouses.map((w) => ({ label: w.name, value: w.id })),
              },
            ]}
          />
          <Link href={ROUTES.DELIVERY_NEW}>
            <Button className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700 gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Delivery
            </Button>
          </Link>
        </div>
        <p className="text-xs text-slate-400">{filtered.length} of {deliveries.length} deliveries</p>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <p className="text-slate-400 text-sm">No deliveries match your filters.</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show"
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {["Customer", "Items", "Warehouse", "Status", "Date", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <motion.tr key={d.id} variants={item} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">{d.customer}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{d.items.length} item(s)</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{warehouses.find((w) => w.id === d.warehouseId)?.name ?? d.warehouseId}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={STATUS_COLORS[d.status as string] ?? ""}>{d.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{formatDate(safeDate(d.createdAt))}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={ROUTES.DELIVERY_DETAIL(d.id)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">View →</Link>
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
