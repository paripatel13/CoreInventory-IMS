export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidSKU(sku: string): boolean {
  return sku.trim().length >= 2;
}

export function isPositiveNumber(val: number): boolean {
  return typeof val === "number" && val > 0;
}
