import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNgn, startingPrice, type Product, type PricingTier } from "@/lib/products";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Row = Product & { pricing_tiers: PricingTier[] };

function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, pricing_tiers(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Row[]) ?? [];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveProduct = useMutation({
    mutationFn: async (p: { id: string; name: string; description: string; category: string; fabric: string; moq: number }) => {
      const { error } = await supabase
        .from("products")
        .update({ name: p.name, description: p.description, category: p.category, fabric: p.fabric, moq: p.moq })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-secondary/40 text-left">
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>MOQ</Th>
              <Th>Starting price</Th>
              <Th>Tiers</Th>
              <Th>Active</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : !products || products.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products.</td></tr>
            ) : (
              products.map((p) => {
                const sp = startingPrice(p.pricing_tiers);
                return (
                  <tr key={p.id} className="border-t border-border">
                    <Td>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.fabric}</div>
                    </Td>
                    <Td className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</Td>
                    <Td>{p.moq}</Td>
                    <Td className="font-display">{sp ? formatNgn(sp) : "—"}</Td>
                    <Td className="text-xs text-muted-foreground">
                      {p.pricing_tiers.length} tier{p.pricing_tiers.length === 1 ? "" : "s"}
                    </Td>
                    <Td>
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={p.is_active}
                          onChange={(e) => toggleActive.mutate({ id: p.id, is_active: e.target.checked })}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="text-xs uppercase tracking-wider">{p.is_active ? "Live" : "Hidden"}</span>
                      </label>
                    </Td>
                    <Td>
                      <button
                        onClick={() => setEditing(p)}
                        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-primary hover:text-accent"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(v) => saveProduct.mutate({ id: editing.id, ...v })}
          saving={saveProduct.isPending}
        />
      )}
    </div>
  );
}

function EditModal({
  product,
  onClose,
  onSave,
  saving,
}: {
  product: Row;
  onClose: () => void;
  onSave: (v: { name: string; description: string; category: string; fabric: string; moq: number }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [category, setCategory] = useState(product.category);
  const [fabric, setFabric] = useState(product.fabric ?? "");
  const [moq, setMoq] = useState(product.moq);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl border border-border bg-background p-8">
        <p className="eyebrow">Edit product</p>
        <h2 className="mt-2 font-display text-3xl">{product.name}</h2>

        <div className="mt-6 space-y-4">
          <Input label="Name" value={name} onChange={setName} />
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <Input label="Category" value={category} onChange={setCategory} />
          <Input label="Fabric" value={fabric} onChange={setFabric} />
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">MOQ</label>
            <input
              type="number"
              value={moq}
              min={1}
              onChange={(e) => setMoq(Number(e.target.value))}
              className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-sm border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] hover:border-primary">
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={() => onSave({ name, description, category, fabric, moq })}
            className="rounded-sm bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground hover:bg-accent disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-4 align-top ${className}`}>{children}</td>;
}
