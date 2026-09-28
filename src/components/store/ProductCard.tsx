import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { useCart } from "@/hooks/useCart";
import { formatPrice, type Product } from "@/lib/store";

export function ProductCard({ product, symbol }: { product: Product; symbol: string }) {
  const { add } = useCart();
  const soldOut = product.stock <= 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="block aspect-square overflow-hidden bg-background"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No photo yet
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.category}
        </span>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="font-display text-base font-semibold leading-snug text-foreground"
        >
          {product.name}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="font-display text-lg font-bold text-foreground">
            {formatPrice(product.price, symbol)}
          </span>
          {soldOut ? (
            <span className="rounded-md border border-destructive px-2 py-1 text-xs font-medium text-destructive">
              Out of stock
            </span>
          ) : product.stock <= 3 ? (
            <span className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground">
              Only {product.stock} left
            </span>
          ) : (
            <span className="rounded-md border border-success px-2 py-1 text-xs font-medium text-success">
              In stock
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            add({
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
            });
            toast.success(`${product.name} added to your order list`);
          }}
          className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
        >
          {soldOut ? "Unavailable" : "Add"}
        </button>
      </div>
    </article>
  );
}
