"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getDocument, updateDocument } from "../../../../../lib/firebase/firestore";
import { applyStockDelta } from "../../../../../lib/utils/stockCalculations";
import Topbar from "../../../../../components/layout/Topbar";

import { STATUS, STATUS_COLORS } from "../../../../../constants/status";
import { ROUTES } from "../../../../../constants/routes";
import { Delivery } from "../../../../../types/operation";
import { Product } from "../../../../../types/product";
 import { Button,Badge } from "../../../../../components/ui/index";
export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDocument("deliveries", id).then((d) => setDelivery(d as unknown as Delivery));
  }, [id]);

  async function handleValidate() {
    if (!delivery) return;
    setLoading(true);
    try {
      for (const item of delivery.items) {
        const prod = await getDocument("products", item.productId) as Product;
        if (prod) {
          const updated = applyStockDelta(prod.stockByLocation ?? {}, item.locationId ?? "default", -item.quantity);
          await updateDocument("products", item.productId, { stockByLocation: updated });
        }
      }
      await updateDocument("deliveries", id, { status: STATUS.DONE });
      toast.success("Delivery validated! Stock reduced.");
      router.push(ROUTES.DELIVERIES);
    } catch {
      toast.error("Validation failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!delivery) return <div className="flex-1"><Topbar title="Delivery" /><div className="p-6"><div className="h-40 rounded-xl bg-slate-100 animate-pulse" /></div></div>;

  return (
    <div className="flex-1">
      <Topbar title="Delivery Detail" />
      <div className="p-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Customer</p>
              <p className="text-lg font-semibold text-slate-900 mt-0.5">{delivery.customer}</p>
            </div>
            <Badge variant="outline" className={STATUS_COLORS[delivery.status]}>{delivery.status}</Badge>
          </div>
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Product</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Location</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Qty</th>
                </tr>
              </thead>
              <tbody>
                {delivery.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-900 font-medium">{item.productName}</td>
                    <td className="px-4 py-3 text-slate-500">{item.locationId ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            {delivery.status !== STATUS.DONE && delivery.status !== STATUS.CANCELED && (
              <Button onClick={handleValidate} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "Validating..." : "✓ Validate & Reduce Stock"}
              </Button>
            )}
            <Button variant="outline" onClick={() => router.back()}>Back</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
