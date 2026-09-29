import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { useCart } from "@/hooks/useCart";
import { formatPrice, getProductImage, type Product } from "@/lib/store";

export function ProductCard({ product, symbol }: { product: Product; symbol: string }) {
  const { add } = useCart();
  const soldOut = product.stock <= 0;
  const productImage = getProductImage(product);

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="block aspect-square overflow-hidden bg-background"
      >
        <img
          src={productImage.src}
          alt={productImage.isFallback ? `${product.category} collection` : product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
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

        <div className="mt-auto flex flex-col items-start gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="font-display text-base font-bold text-foreground sm:text-lg">
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
            const accepted = add({
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: productImage.src,
              stock: product.stock,
            });
            if (accepted > 0) {
              toast.success(`${product.name} added to your order list`);
            } else toast.error("Your order list already has all available stock");
          }}
          className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
        >
          {soldOut ? "Unavailable" : "Add"}
        </button>
      </div>
    </article>
  );
}
