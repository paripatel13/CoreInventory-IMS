"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { addDocument } from "../../../../../lib/firebase/firestore";
import { useProducts } from "../../../../../hooks/useProducts";
import { useWarehouses } from "../../../../../hooks/useWarehouses";
import Topbar from "../../../../../components/layout/Topbar";
import { Button, Input, Label } from "../../../../../components/ui/index";
import { ROUTES } from "../../../../../constants/routes";
import { STATUS } from "../../../../../constants/status";
import { OperationItem } from "../../../../../types/operation";
import { Product } from "../../../../../types/product";

export default function NewTransferPage() {
  const router = useRouter();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();

  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [items, setItems] = useState<OperationItem[]>([
    { productId: "", productName: "", quantity: 1, locationId: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const fromWarehouse = warehouses.find((w) => w.id === fromWarehouseId);
  const toWarehouse = warehouses.find((w) => w.id === toWarehouseId);

  // Get locations where a product has stock (for FROM side)
  function getProductStockLocations(productId: string) {
    const prod = products.find((p) => p.id === productId) as Product | undefined;
    if (!prod || !prod.stockByLocation) return [];
    return Object.entries(prod.stockByLocation)
      .filter(([, qty]) => qty > 0)
      .map(([locId, qty]) => {
        const warehouseLoc = fromWarehouse?.locations?.find((l) => l.id === locId);
        return { id: locId, name: warehouseLoc?.name ?? locId, stock: qty };
      });
  }

  function updateItem(i: number, key: keyof OperationItem, val: string | number) {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== i) return item;
        if (key === "productId") {
          const prod = products.find((p) => p.id === val);
          return { ...item, productId: val as string, productName: prod?.name ?? "", locationId: "" };
        }
        return { ...item, [key]: val };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fromWarehouseId || !fromLocationId) {
      toast.error("Please select From warehouse and location.");
      return;
    }
    if (!toWarehouseId || !toLocationId) {
      toast.error("Please select To warehouse and location.");
      return;
    }
    if (fromLocationId === toLocationId) {
      toast.error("From and To locations cannot be the same.");
      return;
    }

    // Validate stock for each item
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId) as Product | undefined;
      if (!prod) { toast.error("Product not found."); return; }
      const available = (prod.stockByLocation ?? {})[fromLocationId] ?? 0;
      if (available < item.quantity) {
        toast.error(`Insufficient stock for "${item.productName}". Available at source: ${available}`);
        return;
      }
    }

    setLoading(true);
    try {
      await addDocument("transfers", {
        fromWarehouseId,
        fromWarehouseName: fromWarehouse?.name ?? fromWarehouseId,
        fromLocation: fromLocationId,
        fromLocationName: fromWarehouse?.locations?.find((l) => l.id === fromLocationId)?.name ?? fromLocationId,
        toWarehouseId,
        toWarehouseName: toWarehouse?.name ?? toWarehouseId,
        toLocation: toLocationId,
        toLocationName: toWarehouse?.locations?.find((l) => l.id === toLocationId)?.name ?? toLocationId,
        items,
        status: STATUS.DRAFT,
      });
      toast.success("Transfer created!");
      router.push(ROUTES.TRANSFERS);
    } catch {
      toast.error("Failed to create transfer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1">
      <Topbar title="New Transfer" />
      <div className="p-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* From → To Route */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">

              {/* FROM */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">From</p>
                <div className="space-y-1.5">
                  <Label>Warehouse</Label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={fromWarehouseId}
                    onChange={(e) => {
                      setFromWarehouseId(e.target.value);
                      setFromLocationId("");
                      setItems((p) => p.map((i) => ({ ...i, locationId: "" })));
                    }}
                    required
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
                    value={fromLocationId}
                    onChange={(e) => setFromLocationId(e.target.value)}
                    disabled={!fromWarehouseId}
                    required
                  >
                    <option value="">
                      {!fromWarehouseId ? "Select warehouse first" : "Select location"}
                    </option>
                    {fromWarehouse?.locations?.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                    {fromWarehouseId && (!fromWarehouse?.locations || fromWarehouse.locations.length === 0) && (
                      <option value={fromWarehouseId}>{fromWarehouse?.name}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center pt-10">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>

              {/* TO */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">To</p>
                <div className="space-y-1.5">
                  <Label>Warehouse</Label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={toWarehouseId}
                    onChange={(e) => {
                      setToWarehouseId(e.target.value);
                      setToLocationId("");
                    }}
                    required
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
                    value={toLocationId}
                    onChange={(e) => setToLocationId(e.target.value)}
                    disabled={!toWarehouseId}
                    required
                  >
                    <option value="">
                      {!toWarehouseId ? "Select warehouse first" : "Select location"}
                    </option>
                    {toWarehouse?.locations?.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                    {toWarehouseId && (!toWarehouse?.locations || toWarehouse.locations.length === 0) && (
                      <option value={toWarehouseId}>{toWarehouse?.name}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items to Transfer</Label>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => setItems((p) => [...p, { productId: "", productName: "", quantity: 1, locationId: "" }])}
                  className="gap-1 text-xs"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </Button>
              </div>

              {items.map((item, i) => {
                const stockLocations = getProductStockLocations(item.productId);
                const availableAtFrom = fromLocationId
                  ? (products.find((p) => p.id === item.productId) as Product | undefined)
                      ?.stockByLocation?.[fromLocationId] ?? 0
                  : 0;

                return (
                  <div key={i} className="grid grid-cols-[1fr_100px_36px] gap-2 items-end">

                    {/* Product */}
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs text-slate-400">Product</Label>}
                      <select
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={item.productId}
                        onChange={(e) => updateItem(i, "productId", e.target.value)}
                        required
                      >
                        <option value="">Select product</option>
                        {products
                          .filter((p) => {
                            // Only show products that have stock at FROM location
                            if (!fromLocationId) return true;
                            return ((p as Product).stockByLocation?.[fromLocationId] ?? 0) > 0;
                          })
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {fromLocationId
                                ? ` (${(p as Product).stockByLocation?.[fromLocationId] ?? 0} available)`
                                : ""}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      {i === 0 && (
                        <Label className="text-xs text-slate-400">
                          Qty {item.productId && fromLocationId ? `(max ${availableAtFrom})` : ""}
                        </Label>
                      )}
                      <Input
                        type="number"
                        min={1}
                        max={availableAtFrom || undefined}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                        required
                      />
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-500 transition-colors pb-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Route Summary */}
            {fromLocationId && toLocationId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-600 flex items-center gap-2"
              >
                <span className="font-medium text-slate-900">
                  {fromWarehouse?.name} / {fromWarehouse?.locations?.find((l) => l.id === fromLocationId)?.name ?? fromLocationId}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-900">
                  {toWarehouse?.name} / {toWarehouse?.locations?.find((l) => l.id === toLocationId)?.name ?? toLocationId}
                </span>
              </motion.div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-slate-900 hover:bg-slate-700" disabled={loading}>
                {loading ? "Creating..." : "Create Transfer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
