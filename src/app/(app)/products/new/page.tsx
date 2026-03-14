"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { addDocument } from "../../../../lib/firebase/firestore";
import Topbar from "../../../../components/layout/Topbar";
 import { Button, Input, Label} from "../../../../components/ui/index";;
import { ROUTES } from "../../../../constants/routes";

type ProductForm = {
  name: string;
  sku: string;
  category: string;
  uom: string;
  reorderLevel: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>({ name: "", sku: "", category: "", uom: "", reorderLevel: "5" });
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addDocument("products", {
        ...form,
        reorderLevel: Number(form.reorderLevel),
        stockByLocation: {},
      });
      toast.success("Product created!");
      router.push(ROUTES.PRODUCTS);
    } catch {
      toast.error("Failed to create product.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1">
      <Topbar title="New Product" />
      <div className="p-6 max-w-xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { id: "name", label: "Product Name", placeholder: "e.g. Steel Rods" },
              { id: "sku", label: "SKU / Code", placeholder: "e.g. STL-001" },
              { id: "category", label: "Category", placeholder: "e.g. Raw Materials" },
              { id: "uom", label: "Unit of Measure", placeholder: "e.g. kg, pcs, litre" },
              { id: "reorderLevel", label: "Reorder Level", placeholder: "5", type: "number" },
            ].map(({ id, label, placeholder, type }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input id={id} type={type ?? "text"} placeholder={placeholder}
                  value={form[id as keyof ProductForm]} onChange={(e) => set(id as keyof ProductForm, e.target.value)} required />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-slate-900 hover:bg-slate-700" disabled={loading}>
                {loading ? "Saving..." : "Create Product"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
