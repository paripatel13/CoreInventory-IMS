"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getDocument, addDocument, updateDocument } from "../../../../../lib/firebase/firestore";
import { useProducts } from "../../../../../hooks/useProducts";
import { useWarehouses } from "../../../../../hooks/useWarehouses";
import Topbar from "../../../../../components/layout/Topbar";
import { Button, Input, Label } from "../../../../../components/ui/index";
import { ROUTES } from "../../../../../constants/routes";
import { Product } from "../../../../../types/product";

export default function NewAdjustmentPage() {
  const router = useRouter();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();

  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [countedQty, setCountedQty] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId) as Product | undefined;
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  // Current stock at selected location
  const currentStock = selectedProduct && locationId
    ? (selectedProduct.stockByLocation?.[locationId] ?? 0)
    : null;

  // Delta preview
  const delta = countedQty !== "" && currentStock !== null
    ? (countedQty as number) - currentStock
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!productId) { toast.error("Select a product."); return; }
    if (!locationId) { toast.error("Select a location."); return; }
    if (countedQty === "") { toast.error("Enter counted quantity."); return; }
    if (!reason.trim()) { toast.error("Enter a reason."); return; }

    setLoading(true);
    try {
      const prod = await getDocument("products", productId) as unknown as Product;
      if (!prod) { toast.error("Product not found."); setLoading(false); return; }

      const current = (prod.stockByLocation ?? {})[locationId] ?? 0;
      const newQty = countedQty as number;
      const finalDelta = newQty - current;

      // Update stock
      const updatedStock = { ...(prod.stockByLocation ?? {}), [locationId]: newQty };
      await updateDocument("products", productId, { stockByLocation: updatedStock });

      // Log adjustment
      await addDocument("adjustments", {
        productId,
        productName: selectedProduct?.name ?? "",
        warehouseId,
        warehouseName: selectedWarehouse?.name ?? warehouseId,
        locationId,
        locationName: selectedWarehouse?.locations?.find((l) => l.id === locationId)?.name ?? locationId,
        previousQty: current,
        countedQty: newQty,
        delta: finalDelta,
        reason,
      });

      toast.success(`Stock adjusted! ${finalDelta >= 0 ? "+" : ""}${finalDelta} units`);
      router.push(ROUTES.ADJUSTMENTS);
    } catch {
      toast.error("Failed to apply adjustment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1">
      <Topbar title="New Adjustment" />
      <div className="p-6 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Product */}
            <div className="space-y-1.5">
              <Label>Product</Label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setWarehouseId("");
                  setLocationId("");
                  setCountedQty("");
                }}
                required
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Warehouse */}
            <div className="space-y-1.5">
              <Label>Warehouse</Label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setLocationId("");
                  setCountedQty("");
                }}
                disabled={!productId}
                required
              >
                <option value="">{!productId ? "Select product first" : "Select warehouse"}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label>Location</Label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  setCountedQty("");
                }}
                disabled={!warehouseId}
                required
              >
                <option value="">{!warehouseId ? "Select warehouse first" : "Select location"}</option>
                {selectedWarehouse?.locations?.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
                {warehouseId && (!selectedWarehouse?.locations || selectedWarehouse.locations.length === 0) && (
                  <option value={warehouseId}>{selectedWarehouse?.name}</option>
                )}
              </select>
            </div>

            {/* Current Stock Preview */}
            {currentStock !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <span className="text-sm text-slate-500">Current stock at this location</span>
                <span className="text-base font-bold text-slate-900">
                  {currentStock} <span className="text-xs font-normal text-slate-400">{selectedProduct?.uom}</span>
                </span>
              </motion.div>
            )}

            {/* Counted Qty */}
            <div className="space-y-1.5">
              <Label>Physically Counted Quantity</Label>
              <Input
                type="number"
                min={0}
                placeholder="Enter actual counted qty"
                value={countedQty}
                onChange={(e) => setCountedQty(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={!locationId}
                required
              />
            </div>

            {/* Delta Preview */}
            {delta !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-lg px-4 py-3 flex items-center justify-between ${
                  delta === 0
                    ? "bg-green-50 border border-green-200"
                    : delta > 0
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <span className={`text-sm font-medium ${
                  delta === 0 ? "text-green-700" : delta > 0 ? "text-blue-700" : "text-red-700"
                }`}>
                  {delta === 0
                    ? "✓ Stock matches — no change needed"
                    : delta > 0
                    ? `↑ Stock will increase by ${delta} ${selectedProduct?.uom ?? ""}`
                    : `↓ Stock will decrease by ${Math.abs(delta)} ${selectedProduct?.uom ?? ""}`}
                </span>
                <span className={`text-lg font-bold ${
                  delta === 0 ? "text-green-700" : delta > 0 ? "text-blue-700" : "text-red-600"
                }`}>
                  {delta > 0 ? "+" : ""}{delta}
                </span>
              </motion.div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Select reason</option>
                <option value="Physical count correction">Physical count correction</option>
                <option value="Damaged goods">Damaged goods</option>
                <option value="Theft / shrinkage">Theft / shrinkage</option>
                <option value="Expired stock">Expired stock</option>
                <option value="Found unrecorded stock">Found unrecorded stock</option>
                <option value="Data entry error">Data entry error</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="bg-slate-900 hover:bg-slate-700"
                disabled={loading || delta === 0}
              >
                {loading ? "Applying..." : "Apply Adjustment"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>

            {delta === 0 && countedQty !== "" && (
              <p className="text-xs text-green-600">Stock is already correct — no adjustment needed.</p>
            )}

          </form>
        </motion.div>
      </div>
    </div>
  );
}
