export interface OperationItem {
  productId: string;
  productName: string;
  quantity: number;
  locationId?: string;
}

export interface Receipt {
  id: string;
  supplier: string;
  warehouseId: string;
  items: OperationItem[];
  status: string;
  createdAt?: unknown;
}

export interface Delivery {
  id: string;
  customer: string;
  warehouseId: string;
  items: OperationItem[];
  status: string;
  createdAt?: unknown;
}

export interface Transfer {
  id: string;
  fromWarehouseId?: string;
  fromWarehouseName?: string;
  fromLocation?: string;
  fromLocationId?: string;
  fromLocationName?: string;
  toWarehouseId?: string;
  toWarehouseName?: string;
  toLocation?: string;
  toLocationId?: string;
  toLocationName?: string;
  items: OperationItem[];
  status: string;
  createdAt?: unknown;
}

export interface Adjustment {
  id: string;
  productId: string;
  productName: string;
  warehouseId?: string;
  warehouseName?: string;
  locationId: string;
  locationName?: string;
  previousQty: number;
  countedQty: number;
  delta: number;
  reason: string;
  createdAt?: unknown;
}