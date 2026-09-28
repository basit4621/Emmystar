import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { MessageCircle, ShieldCheck, Timer } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/store/ProductCard";
import { SiteChrome } from "@/components/store/SiteChrome";
import { Skeleton } from "@/components/ui/skeleton";
import { productsQuery, settingsQuery } from "@/lib/store";

import heroDevices from "@/assets/hero-devices.png";
import catIphones from "@/assets/cat-iphones.jpg";
import catSamsung from "@/assets/cat-samsung.jpg";
import catLaptops from "@/assets/cat-laptops.jpg";
import trustStore from "@/assets/trust-store.jpg";

type HomeSearch = { category?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Emmy Star — Buy verified iPhones, Samsung & laptops in Nigeria" },
      {
        name: "description",
        content:
          "Browse tested iPhones, Samsung phones, laptops and accessories at Emmy Star. Add to your order list and confirm on WhatsApp.",
      },
      { property: "og:title", content: "Emmy Star — Buy gadgets with confidence" },
      {
        property: "og:description",
        content: "Every iPhone, Samsung and laptop at Emmy Star is tested and verified before sale.",
      },
    ],
  }),
  component: Home,
});

const CATEGORY_CARDS = [
  { name: "iPhones", image: catIphones, blurb: "Tested and unlocked" },
  { name: "Samsung", image: catSamsung, blurb: "Flagships and mid-range" },
  { name: "Laptops", image: catLaptops, blurb: "Work and school ready" },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: "Checked before sale", body: "Battery, camera, ports and screen tested on every device." },
  { icon: MessageCircle, title: "Order on WhatsApp", body: "Send your list and confirm with a real person, not a robot." },
  { icon: Timer, title: "Fast turnaround", body: "Same-day pickup in Lagos and quick nationwide dispatch." },
];

function Home() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [search, setSearch] = useState("");

  const settings = useQuery(settingsQuery);
  const products = useQuery(productsQuery);

  const symbol = settings.data?.currency_symbol ?? "₦";

  const categories = useMemo(() => {
    const all = new Set((products.data ?? []).map((product) => product.category));
    return ["All", ...Array.from(all)];
  }, [products.data]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products.data ?? []).filter((product) => {
      const matchesCategory = !category || product.category === category;
      const matchesTerm =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [products.data, category, search]);

  const storeSettings = settings.data ?? {
    id: 1,
    store_name: "Emmy Star",
    tagline: "Tested and verified gadgets",
    whatsapp_number: "2348012345678",
    currency_symbol: "₦",
  };

  return (
    <SiteChrome settings={storeSettings}>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
              Buy gadgets with confidence.
            </h1>
            <p className="mt-4 max-w-md text-base opacity-85">
              Every iPhone, Samsung, and laptop at {storeSettings.store_name} is tested and verified
              before sale. Add to your order and confirm on WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#shop"
                className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
              >
                Browse the shop
              </a>
              <a
                href={`https://wa.me/${storeSettings.whatsapp_number}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-primary-foreground px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src={heroDevices}
              alt="Line drawing of a phone and a laptop"
              width={512}
              height={512}
              className="w-full max-w-sm"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORY_CARDS.map((card) => (
            <Link
              key={card.name}
              to="/"
              search={{ category: card.name }}
              hash="shop"
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <img
                src={card.image}
                alt={`${card.name} at Emmy Star`}
                loading="lazy"
                width={800}
                height={600}
                className="h-40 w-full object-cover"
              />
              <div className="p-4">
                <h2 className="font-display text-lg font-semibold">{card.name}</h2>
                <p className="text-sm text-muted-foreground">{card.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="shop" className="mx-auto w-full max-w-6xl px-4 pb-12">
        <h2 className="font-display text-2xl font-bold">Shop</h2>

        <div className="mt-4 flex flex-col gap-4">
          <label className="sr-only" htmlFor="product-search">
            Search products
          </label>
          <input
            id="product-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search iPhone, Samsung, laptop…"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm"
          />

          <div className="flex flex-wrap gap-2">
            {categories.map((name) => {
              const active = name === "All" ? !category : category === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    navigate({
                      search: { category: name === "All" ? undefined : name },
                      hash: "shop",
                    })
                  }
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.isLoading &&
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-4">
                <Skeleton className="mb-4 aspect-square w-full rounded-md" />
                <Skeleton className="mb-2 h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}

          {products.data &&
            visible.map((product) => (
              <ProductCard key={product.id} product={product} symbol={symbol} />
            ))}
        </div>

        {products.data && visible.length === 0 && (
          <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No gadgets match that search yet.
          </p>
        )}
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
          <img
            src={trustStore}
            alt="Emmy Star technician testing a phone in the shop"
            loading="lazy"
            width={1200}
            height={800}
            className="w-full rounded-lg border border-border object-cover"
          />
          <div className="space-y-6">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex gap-4">
                <item.icon className="mt-1 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-base font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
