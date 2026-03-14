"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { addDocument } from "../../../../../lib/firebase/firestore";
import { useProducts } from "../../../../../hooks/useProducts";
import { useWarehouses } from "../../../../../hooks/useWarehouses";
import Topbar from "../../../../../components/layout/Topbar";
import { Button, Input, Label } from "../../../../../components/ui/index";
import { ROUTES } from "../../../../../constants/routes";
import { STATUS } from "../../../../../constants/status";
import { OperationItem } from "../../../../../types/operation";

export default function NewReceiptPage() {
  const router = useRouter();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();
  const [supplier, setSupplier] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState<OperationItem[]>([{ productId: "", productName: "", quantity: 1, locationId: "" }]);
  const [loading, setLoading] = useState(false);

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  function updateItem(i: number, key: keyof OperationItem, val: string | number) {
    setItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;
      if (key === "productId") {
        const prod = products.find((p) => p.id === val);
        return { ...item, productId: val as string, productName: prod?.name ?? "" };
      }
      return { ...item, [key]: val };
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouseId) { toast.error("Please select a warehouse."); return; }
    setLoading(true);
    try {
      await addDocument("receipts", {
        supplier,
        warehouseId,
        warehouseName: selectedWarehouse?.name ?? warehouseId,
        items,
        status: STATUS.DRAFT,
      });
      toast.success("Receipt created!");
      router.push(ROUTES.RECEIPTS);
    } catch {
      toast.error("Failed to create receipt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1">
      <Topbar title="New Receipt" />
      <div className="p-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Input placeholder="Supplier name" value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Warehouse</Label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={warehouseId}
                  onChange={(e) => { setWarehouseId(e.target.value); setItems((p) => p.map((i) => ({ ...i, locationId: "" }))); }}
                  required
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => setItems((p) => [...p, { productId: "", productName: "", quantity: 1, locationId: "" }])}
                  className="gap-1 text-xs"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px_36px] gap-2 items-end">
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs text-slate-400">Product</Label>}
                    <select
                      className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={item.productId}
                      onChange={(e) => updateItem(i, "productId", e.target.value)}
                      required
                    >
                      <option value="">Select product</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs text-slate-400">Location</Label>}
                    <select
                      className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={item.locationId ?? ""}
                      onChange={(e) => updateItem(i, "locationId", e.target.value)}
                      required
                    >
                      <option value="">Select location</option>
                      {selectedWarehouse?.locations?.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                      {/* fallback if no locations added yet */}
                      {(!selectedWarehouse?.locations || selectedWarehouse.locations.length === 0) && warehouseId && (
                        <option value={warehouseId}>{selectedWarehouse?.name ?? "Default"}</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs text-slate-400">Qty</Label>}
                    <Input type="number" min={1} value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} required />
                  </div>
                  <button type="button" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-red-500 transition-colors pb-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-slate-900 hover:bg-slate-700" disabled={loading}>
                {loading ? "Saving..." : "Create Receipt"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
