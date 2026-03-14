"use client";
import { useProducts } from "./useProducts";
import { useReceipts } from "./useReceipts";
import { useDeliveries } from "./useDeliveries";
import { isLowStock } from "../lib/utils/stockCalculations";

export function useDashboardKPIs() {
  const { products, loading: pl } = useProducts();
  const { receipts, loading: rl } = useReceipts();
  const { deliveries, loading: dl } = useDeliveries();

  const loading = pl || rl || dl;

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => isLowStock(p.stockByLocation, p.reorderLevel)).length;
  const pendingReceipts = receipts.filter((r) => r.status !== "Done" && r.status !== "Canceled").length;
  const pendingDeliveries = deliveries.filter((d) => d.status !== "Done" && d.status !== "Canceled").length;

  return { totalProducts, lowStockCount, pendingReceipts, pendingDeliveries, loading };
}
