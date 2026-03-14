"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { Delivery } from "../types/operation";

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "deliveries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDeliveries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Delivery)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { deliveries, loading };
}
