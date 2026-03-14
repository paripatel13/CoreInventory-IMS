"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Package, MapPin } from "lucide-react";
import { getDocument, updateDocument, deleteDocument } from "../../../../lib/firebase/firestore";
import Topbar from "../../../../components/layout/Topbar";
import { Button, Input, Label, Badge } from "../../../../components/ui/index";
import { ROUTES } from "../../../../constants/routes";
import { Product } from "../../../../types/product";
import { getTotalStock, isLowStock } from "../../../../lib/utils/stockCalculations";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", category: "", uom: "", reorderLevel: "5" });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    getDocument("products", id).then((p) => {
      if (p) {
        const prod = p as unknown as Product;
        setProduct(prod);
        setForm({
          name: prod.name,
          sku: prod.sku,
          category: prod.category,
          uom: prod.uom,
          reorderLevel: String(prod.reorderLevel ?? 5),
        });
      }
    });
  }, [id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDocument("products", id, { ...form, reorderLevel: Number(form.reorderLevel) });
      toast.success("Product updated!");
      setEditing(false);
      // Refresh
      const updated = await getDocument("products", id);
      setProduct(updated as unknown as Product);
    } catch {
      toast.error("Failed to update.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await deleteDocument("products", id);
    toast.success("Product deleted.");
    router.push(ROUTES.PRODUCTS);
  }

  if (!product) {
    return (
      <div className="flex-1">
        <Topbar title="Product" />
        <div className="p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalStock = getTotalStock(product.stockByLocation ?? {});
  const low = isLowStock(product.stockByLocation ?? {}, product.reorderLevel);
  const stockEntries = Object.entries(product.stockByLocation ?? {});

  return (
    <div className="flex-1">
      <Topbar title="Product Detail" />
      <div className="p-6 max-w-2xl space-y-5">

        {/* Product Overview Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
                <p className="text-sm text-slate-500 font-mono mt-0.5">{product.sku}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={low
                ? "border-red-200 text-red-600 bg-red-50"
                : "border-green-200 text-green-700 bg-green-50"}
            >
              {low ? "Low Stock" : "In Stock"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Category", value: product.category },
              { label: "Unit", value: product.uom },
              { label: "Total Stock", value: totalStock },
              { label: "Reorder At", value: product.reorderLevel ?? 5 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-base font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stock by Location */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-900">Stock by Location</p>
          </div>
          {stockEntries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm">No stock data yet. Validate a receipt to add stock.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {stockEntries.map(([locationId, qty]) => {
                const pct = totalStock > 0 ? Math.round((qty / totalStock) * 100) : 0;
                return (
                  <div key={locationId} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{locationId}</span>
                      <span className="text-sm font-bold text-slate-900">{qty} <span className="text-slate-400 font-normal text-xs">{product.uom}</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-slate-900 h-1.5 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{pct}% of total stock</p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Edit Form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-slate-900">Product Details</p>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {!editing ? (
            <div className="space-y-3">
              {[
                { label: "Name", value: product.name },
                { label: "SKU", value: product.sku },
                { label: "Category", value: product.category },
                { label: "Unit of Measure", value: product.uom },
                { label: "Reorder Level", value: String(product.reorderLevel ?? 5) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
                  <span className="text-sm font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              {[
                { id: "name", label: "Product Name" },
                { id: "sku", label: "SKU / Code" },
                { id: "category", label: "Category" },
                { id: "uom", label: "Unit of Measure" },
                { id: "reorderLevel", label: "Reorder Level", type: "number" },
              ].map(({ id: fid, label, type }) => (
                <div key={fid} className="space-y-1.5">
                  <Label htmlFor={fid}>{label}</Label>
                  <Input
                    id={fid}
                    type={type ?? "text"}
                    value={(form as Record<string, string>)[fid]}
                    onChange={(e) => set(fid, e.target.value)}
                    required
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="bg-slate-900 hover:bg-slate-700" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={handleDelete} className="ml-auto">
                  Delete Product
                </Button>
              </div>
            </form>
          )}
        </motion.div>

      </div>
    </div>
  );
}
