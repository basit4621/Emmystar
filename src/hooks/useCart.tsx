import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "emmy-star-order-list";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore malformed storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    return {
      items,
      count,
      total,
      open,
      setOpen,
      add: (item, quantity = 1) =>
        setItems((current) => {
          const existing = current.find((entry) => entry.id === item.id);
          if (existing) {
            return current.map((entry) =>
              entry.id === item.id ? { ...entry, quantity: entry.quantity + quantity } : entry,
            );
          }
          return [...current, { ...item, quantity }];
        }),
      setQuantity: (id, quantity) =>
        setItems((current) =>
          quantity <= 0
            ? current.filter((entry) => entry.id !== id)
            : current.map((entry) => (entry.id === id ? { ...entry, quantity } : entry)),
        ),
      remove: (id) => setItems((current) => current.filter((entry) => entry.id !== id)),
      clear: () => setItems([]),
    };
  }, [items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
