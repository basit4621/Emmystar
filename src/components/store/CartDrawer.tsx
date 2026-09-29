import { Minus, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { formatPrice, type Settings } from "@/lib/store";

export function CartDrawer({ settings }: { settings: Settings }) {
  const { items, total, open, setOpen, setQuantity, remove, clear } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);
  const symbol = settings.currency_symbol;

  const message = [
    `Hello ${settings.store_name}, I would like to order:`,
    `Name: ${customerName.trim()}`,
    `Phone: ${customerPhone.trim()}`,
    "",
    ...items.map(
      (item) =>
        `• ${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity, symbol)}`,
    ),
    "",
    `Total: ${formatPrice(total, symbol)}`,
  ].join("\n");

  const waLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("orders").insert({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        items: items.map((item) => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        total,
        currency_symbol: symbol,
      });

      if (error) {
        toast.error("Could not save your order. Please try again.");
        return;
      }

      setWhatsAppUrl(waLink);
      toast.success("Order saved. Continue to WhatsApp to confirm it with the store.");
    } catch {
      toast.error("Could not save your order. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close order list"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/40"
        />
      )}
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-lg transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold">Your order list</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close order list"
            className="rounded-lg border border-border p-2 text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {whatsAppUrl
                ? "Your order is saved. Open WhatsApp below to confirm it with the store."
                : "Your order list is empty. Add a gadget to get started."}
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 border-b border-border pb-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="font-display text-sm font-bold">
                      {formatPrice(item.price, symbol)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Reduce quantity of ${item.name}`}
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        className="rounded-md border border-border p-1"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="rounded-md border border-border p-1"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {item.quantity >= item.stock && (
                        <span className="text-xs text-muted-foreground">Stock limit</span>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(item.id)}
                        className="ml-auto rounded-md border border-border p-1 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-border px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-xl font-bold">{formatPrice(total, symbol)}</span>
          </div>
          {whatsAppUrl ? (
            <div>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                Order saved. Continue to WhatsApp to confirm it with the store.
              </p>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  clear();
                  setWhatsAppUrl(null);
                  setCustomerName("");
                  setCustomerPhone("");
                }}
                className="block rounded-lg bg-success px-4 py-3 text-center text-sm font-semibold text-success-foreground"
              >
                Continue to WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={submitOrder} className="space-y-3">
              <label className="sr-only" htmlFor="order-customer-name">Your name</label>
              <input
                id="order-customer-name"
                autoComplete="name"
                required
                maxLength={120}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
              <label className="sr-only" htmlFor="order-customer-phone">Phone number</label>
              <input
                id="order-customer-phone"
                type="tel"
                autoComplete="tel"
                required
                minLength={7}
                maxLength={30}
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Phone number"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={items.length === 0 || saving}
                className="block w-full rounded-lg bg-success px-4 py-3 text-center text-sm font-semibold text-success-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving order…" : "Save order and continue"}
              </button>
            </form>
          )}
        </footer>
      </aside>
    </>
  );
}
