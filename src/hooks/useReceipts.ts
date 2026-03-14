"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { Receipt } from "../types/operation";

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "receipts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setReceipts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Receipt)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { receipts, loading };
}
