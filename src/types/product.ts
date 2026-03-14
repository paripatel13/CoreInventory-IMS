export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  uom: string;
  stockByLocation: Record<string, number>;
  reorderLevel?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
}
