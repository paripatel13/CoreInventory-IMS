import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { Transfer } from "../types/operation";

export function useTransfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "transfers"), (snap) => {
      setTransfers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transfer)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { transfers, loading };
}