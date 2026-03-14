"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useProducts } from "../../../hooks/useProducts";
import Topbar from "../../../components/layout/Topbar";
import { Button, Badge } from "../../../components/ui/index";
import FilterBar from "../../../components/ui/FilterBar";
import { ROUTES } from "../../../constants/routes";
import { getTotalStock, isLowStock } from "../../../lib/utils/stockCalculations";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function ProductsPage() {
  const { products, loading } = useProducts();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const filtered = products.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    const low = isLowStock(p.stockByLocation, p.reorderLevel);
    const matchStock = !stockFilter ||
      (stockFilter === "low" && low) ||
      (stockFilter === "ok" && !low);
    return matchSearch && matchCategory && matchStock;
  });

  return (
    <div className="flex-1">
      <Topbar title="Products" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search name or SKU..."
            filters={[
              {
                key: "category", label: "Category",
                value: categoryFilter, onChange: setCategoryFilter,
                options: categories.map((c) => ({ label: c, value: c })),
              },
              {
                key: "stock", label: "Stock",
                value: stockFilter, onChange: setStockFilter,
                options: [
                  { label: "Low Stock", value: "low" },
                  { label: "In Stock", value: "ok" },
                ],
              },
            ]}
          />
          <Link href={ROUTES.PRODUCT_NEW}>
            <Button className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700 gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </Link>
        </div>
        <p className="text-xs text-slate-400">{filtered.length} of {products.length} products</p>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <p className="text-slate-400 text-sm">No products match your filters.</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show"
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {["Product", "SKU", "Category", "UoM", "Stock", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const total = getTotalStock(p.stockByLocation);
                    const low = isLowStock(p.stockByLocation, p.reorderLevel);
                    return (
                      <motion.tr key={p.id} variants={item} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">{p.name}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.sku}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{p.category}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{p.uom}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100">{total}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline"
                            className={low ? "border-red-200 text-red-600 bg-red-50" : "border-green-200 text-green-700 bg-green-50"}>
                            {low ? "Low Stock" : "In Stock"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={ROUTES.PRODUCT_DETAIL(p.id)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors">Edit →</Link>
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