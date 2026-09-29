import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { SiteChrome } from "@/components/store/SiteChrome";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/useCart";
import {
  DEFAULT_WHATSAPP_NUMBER,
  formatPrice,
  getProductImage,
  productsQuery,
  settingsQuery,
} from "@/lib/store";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product details — Emmy Star" },
      {
        name: "description",
        content: "See full details, price and stock for this verified gadget at Emmy Star.",
      },
      { property: "og:title", content: "Product details — Emmy Star" },
      {
        property: "og:description",
        content: "Verified iPhones, Samsung phones and laptops, ordered on WhatsApp.",
      },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);

  const settings = useQuery(settingsQuery);
  const products = useQuery(productsQuery);
  const product = products.data?.find((entry) => entry.id === id);
  const productImage = product ? getProductImage(product) : null;

  const storeSettings = settings.data ?? {
    id: 1,
    store_name: "Emmy Star",
    tagline: "Tested and verified gadgets",
    whatsapp_number: DEFAULT_WHATSAPP_NUMBER,
    currency_symbol: "₦",
  };

  return (
    <SiteChrome settings={storeSettings}>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <Link to="/" search={{ category: undefined }} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to shop
        </Link>

        {products.isLoading && (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        )}

        {products.data && !product && (
          <p className="mt-10 rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            That gadget is no longer listed.
          </p>
        )}

        {product && (
          <div className="mt-6 grid gap-10 md:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {productImage ? (
                <img
                  src={productImage.src}
                  alt={productImage.isFallback ? `${product.category} collection` : product.name}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                  No photo yet
                </div>
              )}
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {product.category}
              </span>
              <h1 className="mt-2 font-display text-3xl font-bold">{product.name}</h1>
              <p className="mt-3 font-display text-2xl font-bold">
                {formatPrice(product.price, storeSettings.currency_symbol)}
              </p>

              <p className="mt-2 text-sm">
                {product.stock <= 0 ? (
                  <span className="font-medium text-destructive">Out of stock</span>
                ) : product.stock <= 3 ? (
                  <span className="font-medium text-muted-foreground">
                    Only {product.stock} left
                  </span>
                ) : (
                  <span className="font-medium text-success">In stock</span>
                )}
              </p>

              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-lg border border-border bg-card">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="px-4 py-2"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                    className="px-4 py-2"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    const accepted = add(
                      {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image_url: productImage?.src ?? null,
                        stock: product.stock,
                      },
                      quantity,
                    );
                    if (accepted === quantity) {
                      toast.success(`${product.name} added to your order list`);
                    } else if (accepted > 0) {
                      toast.error(`Only ${accepted} more available; added that amount`);
                    } else {
                      toast.error("Your order list already has all available stock");
                    }
                  }}
                  className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:border disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                >
                  Add to order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SiteChrome>
  );
}
