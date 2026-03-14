"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useWarehouses } from "../../../../hooks/useWarehouses";
import { deleteDocument, updateDocument, addDocument } from "../../../../lib/firebase/firestore";
import Topbar from "../../../../components/layout/Topbar";
import { Button, Input, Label } from "../../../../components/ui/index";

export default function WarehousesPage() {
  const { warehouses } = useWarehouses();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [newLocations, setNewLocations] = useState<Record<string, string>>({});

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await addDocument("warehouses", { name, locations: [] });
      toast.success("Warehouse added!");
      setName("");
    } catch {
      toast.error("Failed to add warehouse.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLocation(warehouseId: string) {
    const locName = newLocations[warehouseId]?.trim();
    if (!locName) return;
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    if (!warehouse) return;
    const existing = warehouse.locations ?? [];
    const newLoc = { id: locName.toLowerCase().replace(/\s+/g, "-"), name: locName };
    await updateDocument("warehouses", warehouseId, { locations: [...existing, newLoc] });
    toast.success("Location added!");
    setNewLocations((p) => ({ ...p, [warehouseId]: "" }));
  }

  async function handleDeleteLocation(warehouseId: string, locId: string) {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    if (!warehouse) return;
    const updated = (warehouse.locations ?? []).filter((l) => l.id !== locId);
    await updateDocument("warehouses", warehouseId, { locations: updated });
    toast.success("Location removed.");
  }

  async function handleDeleteWarehouse(id: string) {
    await deleteDocument("warehouses", id);
    toast.success("Warehouse deleted.");
  }

  return (
    <div className="flex-1">
      <Topbar title="Warehouses & Locations" />
      <div className="p-6 max-w-2xl space-y-6">

        {/* Add Warehouse */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-900 mb-4">Add New Warehouse</p>
          <form onSubmit={handleAdd} className="flex gap-3">
            <Input placeholder="e.g. Main Warehouse" value={name} onChange={(e) => setName(e.target.value)} required />
            <Button type="submit" className="bg-slate-900 hover:bg-slate-700 gap-2 shrink-0" disabled={loading}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </form>
        </motion.div>

        {/* Warehouse List */}
        {warehouses.map((w) => (
          <motion.div key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{w.name}</p>
              <button onClick={() => handleDeleteWarehouse(w.id)}
                className="text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Locations */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase tracking-wide">Locations</Label>
              {(w.locations ?? []).length === 0 ? (
                <p className="text-xs text-slate-400">No locations yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(w.locations ?? []).map((l) => (
                    <div key={l.id} className="flex items-center gap-1.5 bg-slate-100 rounded-md px-2.5 py-1 text-xs text-slate-700">
                      {l.name}
                      <button onClick={() => handleDeleteLocation(w.id, l.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="New location name"
                  className="h-8 text-xs"
                  value={newLocations[w.id] ?? ""}
                  onChange={(e) => setNewLocations((p) => ({ ...p, [w.id]: e.target.value }))}
                />
                <Button type="button" size="sm" variant="outline"
                  onClick={() => handleAddLocation(w.id)}
                  className="gap-1 text-xs shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add Location
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
