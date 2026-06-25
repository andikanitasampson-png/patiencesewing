import { supabase } from "@/integrations/supabase/client";

export type PricingTier = {
  id: string;
  product_id: string;
  min_qty: number;
  max_qty: number | null;
  unit_price_ngn: number;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fabric: string | null;
  images: string[];
  videos: string[];
  colors: string[];
  sizes: string[];
  moq: number;
  is_active: boolean;
  retail_price_ngn: number;
  compare_at_price_ngn: number | null;
  created_at: string;
};

export type ProductWithTiers = Product & { pricing_tiers: PricingTier[] };

export const formatNgn = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export function tierForQty(tiers: PricingTier[], qty: number): PricingTier | null {
  const sorted = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
  for (const t of sorted) {
    if (qty >= t.min_qty && (t.max_qty === null || qty <= t.max_qty)) return t;
  }
  return sorted[sorted.length - 1] ?? null;
}

export function startingPrice(tiers: PricingTier[]): number | null {
  if (!tiers.length) return null;
  return Math.min(...tiers.map((t) => Number(t.unit_price_ngn)));
}

// Resolve seed-style /src/assets/xxx paths to bundled URLs
import ankara from "@/assets/product-ankara.jpg";
import lace from "@/assets/product-lace.jpg";
import adire from "@/assets/product-adire.jpg";

const ASSET_MAP: Record<string, string> = {
  "/src/assets/product-ankara.jpg": ankara,
  "/src/assets/product-lace.jpg": lace,
  "/src/assets/product-adire.jpg": adire,
};

export function resolveImage(src: string | undefined): string {
  if (!src) return ankara;
  if (ASSET_MAP[src]) return ASSET_MAP[src];
  return src;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchProduct(id: string): Promise<ProductWithTiers | null> {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!product) return null;

  const { data: tiers } = await supabase
    .from("pricing_tiers")
    .select("*")
    .eq("product_id", id)
    .order("min_qty");

  return { ...(product as Product), pricing_tiers: (tiers ?? []) as PricingTier[] };
}
