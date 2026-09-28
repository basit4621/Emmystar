import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

import { CartDrawer } from "@/components/store/CartDrawer";
import { StarLogo } from "@/components/store/StarLogo";
import { useCart } from "@/hooks/useCart";
import type { Settings } from "@/lib/store";

const NAV_LINKS = [
  { label: "Shop", category: undefined },
  { label: "iPhones", category: "iPhones" },
  { label: "Samsung", category: "Samsung" },
  { label: "Laptops", category: "Laptops" },
] as const;

export function SiteChrome({ settings, children }: { settings: Settings; children: ReactNode }) {
  const { count, setOpen } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
          <Link to="/" search={{ category: undefined }} className="flex items-center gap-2">
            <StarLogo className="h-6 w-6 text-accent" />
            <span className="font-display text-lg font-bold">{settings.store_name}</span>
          </Link>

          <nav className="ml-auto hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to="/"
                search={{ category: link.category }}
                hash="shop"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary md:ml-0"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Order list</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
              {count}
            </span>
          </button>
        </div>

        <nav className="flex items-center gap-4 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to="/"
              search={{ category: link.category }}
              hash="shop"
              className="whitespace-nowrap text-sm font-medium text-muted-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StarLogo className="h-5 w-5 text-accent" />
              <span className="font-display text-lg font-bold">{settings.store_name}</span>
            </div>
            <p className="mt-2 max-w-sm text-sm opacity-80">{settings.tagline}</p>
          </div>
          <a
            href={`https://wa.me/${settings.whatsapp_number}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground"
          >
            Chat on WhatsApp
          </a>
        </div>
      </footer>

      <CartDrawer settings={settings} />
    </div>
  );
}
