"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { useAuth } from "../context/AuthContext";
import { BusinessProfile } from "../types/business";

interface BusinessContextType {
  profile: BusinessProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<BusinessProfile>) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType>({
  profile: null,
  loading: true,
  updateProfile: async () => {},
});

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => {
        setProfile(null);
        setLoading(false);
      });
      return;
    }
    const ref = doc(db, "businesses", user.uid);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setProfile(snap.data() as BusinessProfile);
      setLoading(false);
    });
  }, [user]);

  async function updateProfile(data: Partial<BusinessProfile>) {
    if (!user) return;
    const ref = doc(db, "businesses", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, data);
    }
    setProfile((prev) => ({ ...(prev ?? {} as BusinessProfile), ...data }));
  }

  return (
    <BusinessContext.Provider value={{ profile, loading, updateProfile }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);