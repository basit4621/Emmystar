import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MessageCircle, ShieldCheck, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "@/components/store/ProductCard";
import { SiteChrome } from "@/components/store/SiteChrome";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_WHATSAPP_NUMBER, productsQuery, settingsQuery } from "@/lib/store";

import catIphones from "@/assets/iphone-product-photo.jpg";
import catSamsung from "@/assets/cat-samsung.jpg";
import catLaptops from "@/assets/cat-laptops.jpg";
import trustStore from "@/assets/trust-store.jpg";

type HomeSearch = { category: string | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
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

const HERO_SLIDES = [
  { name: "iPhones", image: catIphones, alt: "A collection of verified iPhones" },
  { name: "Samsung", image: catSamsung, alt: "A collection of Samsung smartphones" },
  { name: "Laptops", image: catLaptops, alt: "Laptops ready for work and school" },
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
  const [heroApi, setHeroApi] = useState<CarouselApi>();
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (!heroApi) return;

    const updateHeroIndex = () => setHeroIndex(heroApi.selectedScrollSnap());
    updateHeroIndex();
    heroApi.on("select", updateHeroIndex);

    return () => {
      heroApi.off("select", updateHeroIndex);
    };
  }, [heroApi]);

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
    whatsapp_number: DEFAULT_WHATSAPP_NUMBER,
    currency_symbol: "₦",
  };

  return (
    <SiteChrome settings={storeSettings}>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
          <Carousel opts={{ loop: true }} setApi={setHeroApi}>
            <CarouselContent className="ml-0">
              {HERO_SLIDES.map((slide) => (
                <CarouselItem key={slide.name} className="pl-0">
                  <article className="grid min-h-[500px] overflow-hidden rounded-lg bg-primary md:min-h-[440px] md:grid-cols-2">
                    <div className="relative min-h-[250px] md:min-h-[440px]">
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        width={1200}
                        height={900}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-primary/90 px-4 py-3 text-primary-foreground md:px-6">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                            Explore the collection
                          </p>
                          <p className="mt-1 font-display text-xl font-semibold">{slide.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => heroApi?.scrollPrev()}
                            aria-label="Previous featured category"
                            className="inline-flex size-10 items-center justify-center rounded-md bg-card text-primary transition-colors hover:bg-accent"
                          >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => heroApi?.scrollNext()}
                            aria-label="Next featured category"
                            className="inline-flex size-10 items-center justify-center rounded-md bg-card text-primary transition-colors hover:bg-accent"
                          >
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute right-4 top-4 flex gap-1.5 md:right-6 md:top-6">
                        {HERO_SLIDES.map((dot, index) => (
                          <button
                            key={dot.name}
                            type="button"
                            onClick={() => heroApi?.scrollTo(index)}
                            aria-label={`Show ${dot.name}`}
                            aria-current={heroIndex === index ? "true" : undefined}
                            className={`h-1.5 rounded-full transition-all ${
                              heroIndex === index ? "w-8 bg-accent" : "w-3 bg-card/80"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center px-6 py-8 sm:px-10 md:px-12 md:py-12">
                      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
                        <ShieldCheck className="size-4" aria-hidden="true" />
                        Tested and verified in Nigeria
                      </p>
                      <h1 className="max-w-md font-display text-4xl font-bold leading-tight md:text-5xl">
                        Buy gadgets with confidence.
                      </h1>
                      <p className="mt-4 max-w-md text-base leading-relaxed opacity-85">
                        Every iPhone, Samsung, and laptop at {storeSettings.store_name} is tested
                        before sale. Build your order and confirm it directly on WhatsApp.
                      </p>
                      <div className="mt-7 flex flex-wrap gap-3">
                        <a
                          href="#shop"
                          className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                        >
                          Browse the shop
                        </a>
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
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

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
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
