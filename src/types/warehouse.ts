export interface Location {
  id: string;
  name: string;
}

export interface Warehouse {
  id: string;
  name: string;
  locations: Location[];
  createdAt?: Date;
}
