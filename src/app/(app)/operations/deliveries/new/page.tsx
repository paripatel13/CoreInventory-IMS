"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { addDocument, getDocument, getCollection } from "../../../../../lib/firebase/firestore";
import { useProducts } from "../../../../../hooks/useProducts";
import { useWarehouses } from "../../../../../hooks/useWarehouses";
import { getTotalStock } from "../../../../../lib/utils/stockCalculations";
import Topbar from "../../../../../components/layout/Topbar";
import { Button, Input, Label } from "../../../../../components/ui/index";
import { ROUTES } from "../../../../../constants/routes";
import { STATUS } from "../../../../../constants/status";
import { OperationItem } from "../../../../../types/operation";
import { Product } from "../../../../../types/product";

export default function NewDeliveryPage() {
  const router = useRouter();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();

  const [customer, setCustomer] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  const [allCustomers, setAllCustomers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState<OperationItem[]>([
    { productId: "", productName: "", quantity: 1, locationId: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  // Load past customers for autocomplete
  useEffect(() => {
    getCollection("deliveries").then((deliveries) => {
      const names = [...new Set(
        (deliveries as { customer?: string }[])
          .map((d) => d.customer ?? "")
          .filter(Boolean)
      )];
      setAllCustomers(names);
    });
  }, []);

  function handleCustomerInput(val: string) {
    setCustomer(val);
    if (val.trim().length === 0) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const filtered = allCustomers.filter((c) =>
      c.toLowerCase().includes(val.toLowerCase())
    );
    setCustomerSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }

  function selectCustomer(name: string) {
    setCustomer(name);
    setShowSuggestions(false);
  }

  // Get locations where a product actually has stock
  function getProductStockLocations(productId: string): { id: string; name: string; stock: number }[] {
    const prod = products.find((p) => p.id === productId) as Product | undefined;
    if (!prod || !prod.stockByLocation) return [];

    return Object.entries(prod.stockByLocation)
      .filter(([, qty]) => qty > 0)
      .map(([locId, qty]) => {
        // Try to find location name from selected warehouse
        const warehouseLoc = selectedWarehouse?.locations?.find((l) => l.id === locId);
        return {
          id: locId,
          name: warehouseLoc?.name ?? locId,
          stock: qty,
        };
      });
  }

  function updateItem(i: number, key: keyof OperationItem, val: string | number) {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== i) return item;
        if (key === "productId") {
          const prod = products.find((p) => p.id === val);
          return {
            ...item,
            productId: val as string,
            productName: prod?.name ?? "",
            locationId: "", // reset location when product changes
          };
        }
        return { ...item, [key]: val };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouseId) { toast.error("Please select a warehouse."); return; }

    setLoading(true);
    try {
      // Stock validation
      for (const item of items) {
        const prod = await getDocument("products", item.productId) as Product;
        if (!prod) { toast.error("Product not found."); setLoading(false); return; }

        const locationStock = (prod.stockByLocation ?? {})[item.locationId ?? ""] ?? 0;
        const totalStock = getTotalStock(prod.stockByLocation ?? {});
        const available = item.locationId ? locationStock : totalStock;

        if (available < item.quantity) {
          toast.error(
            `Insufficient stock for "${item.productName}". Available: ${available}`
          );
          setLoading(false);
          return;
        }
      }

      await addDocument("deliveries", {
        customer,
        warehouseId,
        warehouseName: selectedWarehouse?.name ?? warehouseId,
        items,
        status: STATUS.DRAFT,
      });

      toast.success("Delivery order created!");
      router.push(ROUTES.DELIVERIES);
    } catch {
      toast.error("Failed to create delivery.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1">
      <Topbar title="New Delivery" />
      <div className="p-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Customer + Warehouse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Customer with autocomplete */}
              <div className="space-y-1.5 relative">
                <Label>Customer</Label>
                <Input
                  placeholder="Customer name"
                  value={customer}
                  onChange={(e) => handleCustomerInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => {
                    if (customerSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  autoComplete="off"
                  required
                />
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden"
                  >
                    {customerSuggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onMouseDown={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        {c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Warehouse */}
              <div className="space-y-1.5">
                <Label>Warehouse</Label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value);
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
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
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
                return (
                  <div key={i} className="grid grid-cols-[1fr_1fr_80px_36px] gap-2 items-end">

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
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location — only shows locations where product has stock */}
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs text-slate-400">Location (stock)</Label>}
                      <select
                        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={item.locationId ?? ""}
                        onChange={(e) => updateItem(i, "locationId", e.target.value)}
                        disabled={!item.productId}
                        required
                      >
                        <option value="">
                          {!item.productId ? "Select product first" : "Select location"}
                        </option>
                        {stockLocations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.stock} available)
                          </option>
                        ))}
                        {item.productId && stockLocations.length === 0 && (
                          <option disabled value="">No stock available</option>
                        )}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs text-slate-400">Qty</Label>}
                      <Input
                        type="number" min={1}
                        max={stockLocations.find((l) => l.id === item.locationId)?.stock ?? undefined}
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

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-slate-900 hover:bg-slate-700" disabled={loading}>
                {loading ? "Checking stock..." : "Create Delivery"}
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
