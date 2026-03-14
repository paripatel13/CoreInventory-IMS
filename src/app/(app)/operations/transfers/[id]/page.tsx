"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { getDocument, updateDocument } from "../../../../../lib/firebase/firestore";
import { applyStockDelta } from "../../../../../lib/utils/stockCalculations";
import Topbar from "../../../../../components/layout/Topbar";
import { Button, Badge } from "../../../../../components/ui/index";
import { STATUS, STATUS_COLORS } from "../../../../../constants/status";
import { ROUTES } from "../../../../../constants/routes";
import { Product } from "@/src/types/product";

interface TransferItem {
  productId: string;
  productName: string;
  quantity: number;
}

interface TransferDoc {
  id: string;
  fromWarehouseName?: string;
  fromLocationName?: string;
  fromLocation?: string;
  fromLocationId?: string;
  toWarehouseName?: string;
  toLocationName?: string;
  toLocation?: string;
  toLocationId?: string;
  items: TransferItem[];
  status: string;
}

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [transfer, setTransfer] = useState<TransferDoc | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDocument("transfers", id).then((t) => setTransfer(t as unknown as TransferDoc));
  }, [id]);

  // Resolve from/to labels — handles both old and new data formats
  const fromLabel = transfer
    ? transfer.fromWarehouseName && transfer.fromLocationName
      ? `${transfer.fromWarehouseName} / ${transfer.fromLocationName}`
      : transfer.fromLocation ?? transfer.fromLocationId ?? "—"
    : "—";

  const toLabel = transfer
    ? transfer.toWarehouseName && transfer.toLocationName
      ? `${transfer.toWarehouseName} / ${transfer.toLocationName}`
      : transfer.toLocation ?? transfer.toLocationId ?? "—"
    : "—";

  const fromLocationKey = transfer?.fromLocationId ?? transfer?.fromLocation ?? "";
  const toLocationKey = transfer?.toLocationId ?? transfer?.toLocation ?? "";

  async function handleValidate() {
    if (!transfer) return;
    if (!fromLocationKey || !toLocationKey) {
      toast.error("Transfer locations are missing. Please recreate this transfer.");
      return;
    }

    setLoading(true);
    try {
      for (const item of transfer.items) {
        const prod = await getDocument("products", item.productId) as Product;
        if (!prod) { toast.error(`Product "${item.productName}" not found.`); setLoading(false); return; }

        const currentStock = (prod.stockByLocation ?? {})[fromLocationKey] ?? 0;
        if (currentStock < item.quantity) {
          toast.error(`Insufficient stock for "${item.productName}". Available: ${currentStock}`);
          setLoading(false);
          return;
        }

        let stock = applyStockDelta(prod.stockByLocation ?? {}, fromLocationKey, -item.quantity);
        stock = applyStockDelta(stock, toLocationKey, item.quantity);
        await updateDocument("products", item.productId, { stockByLocation: stock });
      }

      await updateDocument("transfers", id, { status: STATUS.DONE });
      toast.success("Transfer validated! Stock moved.");
      router.push(ROUTES.TRANSFERS);
    } catch {
      toast.error("Validation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    await updateDocument("transfers", id, { status: STATUS.CANCELED });
    toast.success("Transfer canceled.");
    router.push(ROUTES.TRANSFERS);
  }

  if (!transfer) {
    return (
      <div className="flex-1">
        <Topbar title="Transfer" />
        <div className="p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <Topbar title="Transfer Detail" />
      <div className="p-6 max-w-2xl space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6"
        >

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Transfer Route</p>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-400 mb-0.5">From</p>
                  <p className="text-sm font-semibold text-slate-900">{fromLabel}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="bg-slate-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-400 mb-0.5">To</p>
                  <p className="text-sm font-semibold text-slate-900">{toLabel}</p>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={STATUS_COLORS[transfer.status as keyof typeof STATUS_COLORS] ?? ""}
            >
              {transfer.status}
            </Badge>
          </div>

          {/* Items Table */}
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Product</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {transfer.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-900 font-medium">{item.productName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {transfer.status !== STATUS.DONE && transfer.status !== STATUS.CANCELED && (
              <>
                <Button
                  onClick={handleValidate}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? "Moving stock..." : "✓ Validate & Move Stock"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="text-red-500 border-red-200 hover:bg-red-50"
                >
                  Cancel Transfer
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => router.push(ROUTES.TRANSFERS)}>
              ← Back to Transfers
            </Button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
