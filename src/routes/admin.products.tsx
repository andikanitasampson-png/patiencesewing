import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload, X, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNgn, resolveImage, startingPrice, type Product, type PricingTier } from "@/lib/products";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Row = Product & { pricing_tiers: PricingTier[] };

type EditState = {
  id?: string;
  name: string;
  description: string;
  category: string;
  fabric: string;
  moq: number;
  colors: string;
  sizes: string;
  images: string[];
  videos: string[];
  retail_price_ngn: number;
  compare_at_price_ngn: number;
};

const empty: EditState = {
  name: "",
  description: "",
  category: "",
  fabric: "",
  moq: 12,
  colors: "",
  sizes: "",
  images: [],
  videos: [],
  retail_price_ngn: 0,
  compare_at_price_ngn: 0,
};

function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EditState | null>(null);

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
    mutationFn: async (p: EditState) => {
      const payload = {
        name: p.name,
        description: p.description || null,
        category: p.category,
        fabric: p.fabric || null,
        moq: p.moq,
        colors: p.colors.split(",").map((s) => s.trim()).filter(Boolean),
        sizes: p.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        images: p.images,
        videos: p.videos,
        retail_price_ngn: p.retail_price_ngn,
        compare_at_price_ngn: p.compare_at_price_ngn > 0 ? p.compare_at_price_ngn : null,
      };
      if (p.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({ ...payload, is_active: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Product saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product removed");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setEditing({ ...empty })}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" /> New product
        </button>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-secondary/40 text-left">
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>MOQ</Th>
              <Th>Starting price</Th>
              <Th>Media</Th>
              <Th>Active</Th>
              <Th>{""}</Th>
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
                      <div className="flex items-center gap-3">
                        {p.images[0] && (
                          <img src={resolveImage(p.images[0])} alt="" className="h-12 w-12 shrink-0 object-cover" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{p.fabric}</div>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</Td>
                    <Td>{p.moq}</Td>
                    <Td className="font-display">{sp ? formatNgn(sp) : "—"}</Td>
                    <Td className="text-xs text-muted-foreground">
                      {p.images.length} img · {p.videos?.length ?? 0} video
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
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setEditing({
                              id: p.id,
                              name: p.name,
                              description: p.description ?? "",
                              category: p.category,
                              fabric: p.fabric ?? "",
                              moq: p.moq,
                              colors: p.colors.join(", "),
                              sizes: p.sizes.join(", "),
                              images: p.images ?? [],
                              videos: p.videos ?? [],
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-primary hover:text-accent"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${p.name}"? This cannot be undone.`)) removeProduct.mutate(p.id);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-destructive hover:opacity-70"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
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
          state={editing}
          setState={setEditing}
          onClose={() => setEditing(null)}
          onSave={() => saveProduct.mutate(editing)}
          saving={saveProduct.isPending}
        />
      )}
    </div>
  );
}

async function uploadToBucket(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  // Long-lived signed URL (1 year) — bucket is private.
  const { data, error: signErr } = await supabase.storage
    .from("product-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signErr || !data) throw signErr ?? new Error("Could not sign URL");
  return data.signedUrl;
}

function EditModal({
  state,
  setState,
  onClose,
  onSave,
  saving,
}: {
  state: EditState;
  setState: (s: EditState) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null, kind: "image" | "video") => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadToBucket(f);
        urls.push(url);
      }
      if (kind === "image") setState({ ...state, images: [...state.images, ...urls] });
      else setState({ ...state, videos: [...state.videos, ...urls] });
      toast.success(`${urls.length} ${kind}${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 py-10" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl border border-border bg-background p-8">
        <p className="eyebrow">{state.id ? "Edit product" : "New product"}</p>
        <h2 className="mt-2 font-display text-3xl">{state.name || "Untitled"}</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={state.name} onChange={(v) => setState({ ...state, name: v })} />
          <Input label="Category" value={state.category} onChange={(v) => setState({ ...state, category: v })} />
          <Input label="Fabric" value={state.fabric} onChange={(v) => setState({ ...state, fabric: v })} />
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">MOQ</label>
            <input
              type="number"
              value={state.moq}
              min={1}
              onChange={(e) => setState({ ...state, moq: Number(e.target.value) })}
              className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <Input label="Colors (comma separated)" value={state.colors} onChange={(v) => setState({ ...state, colors: v })} />
          <Input label="Sizes (comma separated)" value={state.sizes} onChange={(v) => setState({ ...state, sizes: v })} />
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Description</label>
            <textarea
              value={state.description}
              onChange={(e) => setState({ ...state, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Images */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Images</p>
            <button
              type="button"
              disabled={uploading}
              onClick={() => imgInput.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-primary hover:text-accent disabled:opacity-50"
            >
              <Upload className="h-3 w-3" /> Upload
            </button>
            <input
              ref={imgInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleUpload(e.target.files, "image");
                e.target.value = "";
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {state.images.length === 0 && <p className="text-xs text-muted-foreground">No images yet.</p>}
            {state.images.map((src, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden border border-border">
                <img src={resolveImage(src)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setState({ ...state, images: state.images.filter((_, idx) => idx !== i) })}
                  className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Videos */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Videos</p>
            <button
              type="button"
              disabled={uploading}
              onClick={() => vidInput.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-primary hover:text-accent disabled:opacity-50"
            >
              <Upload className="h-3 w-3" /> Upload
            </button>
            <input
              ref={vidInput}
              type="file"
              accept="video/*"
              multiple
              hidden
              onChange={(e) => {
                handleUpload(e.target.files, "video");
                e.target.value = "";
              }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {state.videos.length === 0 && <p className="text-xs text-muted-foreground">No videos yet.</p>}
            {state.videos.map((src, i) => (
              <div key={i} className="relative flex h-20 w-32 items-center justify-center border border-border bg-secondary/40">
                <video src={src} className="h-full w-full object-cover" muted />
                <Film className="absolute inset-0 m-auto h-5 w-5 text-foreground/40" />
                <button
                  type="button"
                  onClick={() => setState({ ...state, videos: state.videos.filter((_, idx) => idx !== i) })}
                  className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {uploading && <p className="mt-3 text-xs text-muted-foreground">Uploading…</p>}

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-sm border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] hover:border-primary">
            Cancel
          </button>
          <button
            disabled={saving || uploading || !state.name || !state.category}
            onClick={onSave}
            className="rounded-sm bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground hover:bg-accent disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {!state.id && (
          <p className="mt-4 text-xs text-muted-foreground">
            Tip: pricing tiers are managed in the database. After creating, add tiers in the backend.
          </p>
        )}
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
