import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  color: string;
  size: string;
  qty: number;
  unitPriceNgn: number; // snapshot at time of add; cart page recomputes via tiers
  moq: number;
  kind: "retail" | "wholesale";
};

type CartState = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  updateQty: (key: string, qty: number, unitPriceNgn?: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | undefined>(undefined);

const STORAGE_KEY = "ps_cart_v1";

export const lineKey = (i: Pick<CartItem, "productId" | "color" | "size">) =>
  `${i.productId}::${i.color}::${i.size}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const key = lineKey(item);
      const existing = prev.find((p) => lineKey(p) === key);
      if (existing) {
        return prev.map((p) =>
          lineKey(p) === key ? { ...p, qty: p.qty + item.qty, unitPriceNgn: item.unitPriceNgn } : p,
        );
      }
      return [...prev, item];
    });
  }, []);

  const updateQty = useCallback((key: string, qty: number, unitPriceNgn?: number) => {
    setItems((prev) =>
      prev.map((p) =>
        lineKey(p) === key
          ? { ...p, qty: Math.max(0, qty), unitPriceNgn: unitPriceNgn ?? p.unitPriceNgn }
          : p,
      ),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((p) => lineKey(p) !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const i of items) {
      c += i.qty;
      s += i.qty * i.unitPriceNgn;
    }
    return { count: c, subtotal: s };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, count, subtotal, addItem, updateQty, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
