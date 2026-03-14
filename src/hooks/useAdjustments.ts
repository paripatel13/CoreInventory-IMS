import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase/config";

export function useAdjustments() {
  const [adjustments, setAdjustments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "adjustments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAdjustments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => {
      // fallback without orderBy if index not created
      const unsub2 = onSnapshot(collection(db, "adjustments"), (snap) => {
        setAdjustments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      return unsub2;
    });
    return () => unsub();
  }, []);

  return { adjustments, loading };
}