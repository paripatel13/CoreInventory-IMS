"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getCollection } from "../../../lib/firebase/firestore";
import Topbar from "../../../components/layout/Topbar";
import { Badge } from "../../../components/ui/index";
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ChevronRight } from "lucide-react";
import { ROUTES } from "../../../constants/routes";
import { STATUS_COLORS } from "../../../constants/status";
import { formatDate } from "../../../lib/utils/formatDate";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

interface KPI {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  iconBg: string;
  href: string;
}

interface ActivityItem {
  id: string;
  type: "receipt" | "delivery" | "transfer" | "adjustment";
  label: string;
  status?: string;
  createdAt: unknown;
}

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

interface StockItem {
  name: string;
  stock: number;
}

const TYPE_COLORS: Record<string, string> = {
  receipt: "bg-green-50 text-green-700 border-green-200",
  delivery: "bg-blue-50 text-blue-700 border-blue-200",
  transfer: "bg-purple-50 text-purple-700 border-purple-200",
  adjustment: "bg-amber-50 text-amber-700 border-amber-200",
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

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [opsChartData, setOpsChartData] = useState<ChartItem[]>([]);
  const [stockChartData, setStockChartData] = useState<StockItem[]>([]);
  const [statusChartData, setStatusChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [products, receipts, deliveries, transfers, adjustments] = await Promise.all([
        getCollection("products"),
        getCollection("receipts"),
        getCollection("deliveries"),
        getCollection("transfers"),
        getCollection("adjustments"),
      ]);

      const typedProducts = products as {
        id: string;
        name: string;
        stockByLocation: Record<string, number>;
        reorderLevel?: number;
      }[];
      const typedReceipts = receipts as { id: string; supplier: string; status: string; createdAt: unknown }[];
      const typedDeliveries = deliveries as { id: string; customer: string; status: string; createdAt: unknown }[];
      const typedTransfers = transfers as {
        id: string;
        fromWarehouseName?: string;
        toWarehouseName?: string;
        fromLocation?: string;
        toLocation?: string;
        status: string;
        createdAt: unknown;
      }[];
      const typedAdjustments = adjustments as { id: string; productName: string; createdAt: unknown }[];

      // KPIs
      const lowStock = typedProducts.filter((p) => {
        const total = Object.values(p.stockByLocation ?? {}).reduce((a, b) => a + b, 0);
        return total <= (p.reorderLevel ?? 5);
      }).length;

      setKpis([
        {
          label: "Total Products",
          value: products.length,
          icon: <Package className="w-5 h-5" />,
          color: "text-blue-600",
          iconBg: "bg-blue-50 dark:bg-blue-900/30",
          href: ROUTES.PRODUCTS,
        },
        {
          label: "Low / Out of Stock",
          value: lowStock,
          icon: <AlertTriangle className="w-5 h-5" />,
          color: "text-amber-600",
          iconBg: "bg-amber-50 dark:bg-amber-900/30",
          href: ROUTES.PRODUCTS,
        },
        {
          label: "Pending Receipts",
          value: typedReceipts.filter((r) => r.status !== "Done" && r.status !== "Canceled").length,
          icon: <ArrowDownToLine className="w-5 h-5" />,
          color: "text-green-600",
          iconBg: "bg-green-50 dark:bg-green-900/30",
          href: ROUTES.RECEIPTS,
        },
        {
          label: "Pending Deliveries",
          value: typedDeliveries.filter((d) => d.status !== "Done" && d.status !== "Canceled").length,
          icon: <ArrowUpFromLine className="w-5 h-5" />,
          color: "text-purple-600",
          iconBg: "bg-purple-50 dark:bg-purple-900/30",
          href: ROUTES.DELIVERIES,
        },
      ]);

      // Operations bar chart
      setOpsChartData([
        { name: "Receipts", value: typedReceipts.length, color: "#22c55e" },
        { name: "Deliveries", value: typedDeliveries.length, color: "#3b82f6" },
        { name: "Transfers", value: typedTransfers.length, color: "#a855f7" },
        { name: "Adjustments", value: typedAdjustments.length, color: "#f59e0b" },
      ]);

      // Top 5 products by stock
      const topProducts = typedProducts
        .map((p) => ({
          name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
          stock: Object.values(p.stockByLocation ?? {}).reduce((a, b) => a + b, 0),
        }))
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5);
      setStockChartData(topProducts);

      // Status pie chart (receipts + deliveries combined)
      const allOps = [...typedReceipts, ...typedDeliveries] as { status: string }[];
      const statusMap: Record<string, number> = {};
      allOps.forEach((o) => {
        statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
      });
      const statusColors: Record<string, string> = {
        Draft: "#94a3b8",
        Done: "#22c55e",
        Canceled: "#ef4444",
        "In Progress": "#3b82f6",
      };
      setStatusChartData(
        Object.entries(statusMap).map(([name, value]) => ({
          name,
          value,
          color: statusColors[name] ?? "#94a3b8",
        }))
      );

      // Activity feed
      const all: ActivityItem[] = [
        ...typedReceipts.map((r) => ({
          id: r.id,
          type: "receipt" as const,
          label: `Receipt from ${r.supplier}`,
          status: r.status,
          createdAt: r.createdAt,
        })),
        ...typedDeliveries.map((d) => ({
          id: d.id,
          type: "delivery" as const,
          label: `Delivery to ${d.customer}`,
          status: d.status,
          createdAt: d.createdAt,
        })),
        ...typedTransfers.map((t) => ({
          id: t.id,
          type: "transfer" as const,
          label: `Transfer: ${t.fromWarehouseName ?? t.fromLocation ?? "?"} → ${t.toWarehouseName ?? t.toLocation ?? "?"}`,
          status: t.status,
          createdAt: t.createdAt,
        })),
        ...typedAdjustments.map((a) => ({
          id: a.id,
          type: "adjustment" as const,
          label: `Adjustment: ${a.productName}`,
          createdAt: a.createdAt,
        })),
      ]
        .sort((a, b) => safeSeconds(b.createdAt) - safeSeconds(a.createdAt))
        .slice(0, 8);

      setActivity(all);
      setLoading(false);
    }
    load();
  }, []);

  const activityHref: Record<string, string> = {
    receipt: ROUTES.RECEIPTS,
    delivery: ROUTES.DELIVERIES,
    transfer: ROUTES.TRANSFERS,
    adjustment: ROUTES.ADJUSTMENTS,
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Dashboard" />
      <div className="p-6 space-y-6">

        {/* KPI Cards */}
        <motion.div
          variants={container} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))
            : kpis.map((k) => (
                <motion.div
                  key={k.label}
                  variants={item}
                  onClick={() => router.push(k.href)}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                >
                  <div className={`p-3 rounded-lg ${k.iconBg} ${k.color}`}>{k.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{k.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{k.label}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors shrink-0" />
                </motion.div>
              ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Operations Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Operations Overview</p>
            {loading ? (
              <div className="h-44 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={opsChartData} barSize={40}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #f1f5f9",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    }}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {opsChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Status Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Order Status</p>
            {loading ? (
              <div className="h-44 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            ) : statusChartData.length === 0 ? (
              <div className="h-44 flex items-center justify-center">
                <p className="text-xs text-slate-400">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #f1f5f9",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Top Products Stock Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Top 5 Products by Stock</p>
          {loading ? (
            <div className="h-44 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
          ) : stockChartData.length === 0 ? (
            <div className="h-44 flex items-center justify-center">
              <p className="text-xs text-slate-400">Add products to see stock levels</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stockChartData} layout="vertical" barSize={18}>
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #f1f5f9",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="stock" fill="#0f172a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</p>
            <span className="text-xs text-slate-400">Last 8 operations</span>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">
                No activity yet. Start by adding products and receipts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {activity.map((a) => (
                <motion.div
                  key={`${a.type}-${a.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => router.push(activityHref[a.type])}
                  className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  <Badge
                    variant="outline"
                    className={`${TYPE_COLORS[a.type]} shrink-0 capitalize`}
                  >
                    {a.type}
                  </Badge>
                  <p className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{a.label}</p>
                  {a.status && (
                    <Badge
                      variant="outline"
                      className={`${STATUS_COLORS[a.status as keyof typeof STATUS_COLORS] ?? ""} shrink-0 text-xs`}
                    >
                      {a.status}
                    </Badge>
                  )}
                  <span className="text-xs text-slate-400 shrink-0">
                    {formatDate(safeDate(a.createdAt))}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors shrink-0" />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}