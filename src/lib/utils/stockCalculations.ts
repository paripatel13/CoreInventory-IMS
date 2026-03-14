export function getTotalStock(stockByLocation: Record<string, number>): number {
  return Object.values(stockByLocation).reduce((sum, qty) => sum + qty, 0);
}

export function isLowStock(stockByLocation: Record<string, number>, reorderLevel = 5): boolean {
  return getTotalStock(stockByLocation) <= reorderLevel;
}

export function applyStockDelta(
  stockByLocation: Record<string, number>,
  locationId: string,
  delta: number
): Record<string, number> {
  return {
    ...stockByLocation,
    [locationId]: (stockByLocation[locationId] ?? 0) + delta,
  };
}
