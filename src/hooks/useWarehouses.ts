"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { Warehouse } from "../types/warehouse";

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "warehouses"), (snap) => {
      setWarehouses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Warehouse)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { warehouses, loading };
}
