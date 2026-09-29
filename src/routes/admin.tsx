import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StarLogo } from "@/components/store/StarLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  LEGACY_WHATSAPP_PLACEHOLDER,
  formatPrice,
  getProductImage,
  ordersQuery,
  productsQuery,
  settingsQuery,
  type OrderStatus,
  type Product,
  type Settings,
  type StoreOrder,
} from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Emmy Star" },
      { name: "description", content: "Private admin area for managing Emmy Star products and store settings." },
      { property: "og:title", content: "Admin — Emmy Star" },
      { property: "og:description", content: "Private admin area for the Emmy Star store owner." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const EMPTY_FORM = {
  id: "",
  name: "",
  category: "iPhones",
  price: "",
  stock: "",
  description: "",
  image_url: "",
};

function Admin() {
  const [access, setAccess] = useState<"loading" | "anonymous" | "not-owner" | "owner">("loading");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setAccess(
        next?.user.app_metadata["role"] === "owner"
          ? "owner"
          : next
            ? "not-owner"
            : "anonymous",
      );
    });
    supabase.auth.getSession().then(({ data: current }) => {
      setAccess(
        current.session?.user.app_metadata["role"] === "owner"
          ? "owner"
          : current.session
            ? "not-owner"
            : "anonymous",
      );
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (access === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (access === "owner") return <Dashboard />;
  if (access === "not-owner") return <AccessDenied />;
  return <LoginCard />;
}

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center">
        <h1 className="font-display text-lg font-bold">Owner access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This account is not authorized to manage the store.
        </p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-6 rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          Sign out
        </button>
        <Link to="/" search={{ category: undefined }} className="ml-3 text-sm text-muted-foreground">
          Back to shop
        </Link>
      </div>
    </div>
  );
}

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = creatingAccount
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else if (creatingAccount) {
      toast.success("Account created. Check your email if confirmation is required.");
    } else toast.success("Welcome back");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <StarLogo className="h-6 w-6 text-accent" />
          <span className="font-display text-lg font-bold">Emmy Star admin</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {creatingAccount ? "Create your store account." : "Store owner sign in."}
        </p>

        <label className="mt-6 block text-sm font-medium" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
        >
          {busy ? "Please wait…" : creatingAccount ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => setCreatingAccount((value) => !value)}
          className="mt-4 w-full text-center text-sm text-muted-foreground underline"
        >
          {creatingAccount ? "Already have an account? Sign in" : "Create the first account"}
        </button>
        {creatingAccount && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            After creating your account, turn off new signups in Cloud settings and grant your
            account owner access before managing the store.
          </p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Store accounts are managed securely through Supabase Auth.
        </p>
        <Link to="/" search={{ category: undefined }} className="mt-4 block text-center text-sm text-muted-foreground">
          Back to shop
        </Link>
      </form>
    </div>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();
  const products = useQuery(productsQuery);
  const settings = useQuery(settingsQuery);
  const [tab, setTab] = useState<"products" | "orders" | "settings">("products");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = Array.from(
    new Set([...CATEGORIES, ...(products.data ?? []).map((product) => product.category)]),
  );

  async function uploadPhoto(): Promise<string | null> {
    if (!file) return form.image_url || null;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5MB or smaller");
      return null;
    }
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data, error: signError } = await supabase.storage
      .from("product-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (signError || !data) {
      toast.error(signError?.message ?? "Could not link the photo");
      return null;
    }
    return data.signedUrl;
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const imageUrl = await uploadPhoto();
    if (file && !imageUrl) {
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      description: form.description,
      image_url: imageUrl,
    };

    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Product updated" : "Product added");
    setForm({ ...EMPTY_FORM });
    setFile(null);
    setPreview(null);
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  const removeProduct = useMutation({
    mutationFn: async (product: Product) => {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-4 py-4 sm:gap-4">
          <StarLogo className="h-5 w-5 text-accent" />
          <span className="font-display text-base font-bold">Emmy Star admin</span>
          <Link to="/" search={{ category: undefined }} className="ml-auto text-sm text-muted-foreground">
            View shop
          </Link>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 flex gap-2">
          {(["products", "orders", "settings"] as const).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize ${
                tab === name
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {tab === "products" ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-border bg-card">
              <h2 className="border-b border-border px-4 py-3 font-display text-base font-semibold">
                Products
              </h2>
              {products.isLoading && <Skeleton className="m-4 h-40" />}
              <ul>
                {(products.data ?? []).map((product) => (
                  <li
                    key={product.id}
                    className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-border px-3 py-3 last:border-b-0 sm:grid-cols-[3rem_minmax(0,1fr)_auto_auto] sm:px-4"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                      <img
                        src={getProductImage(product).src}
                        alt={`${product.category} collection`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category} · {formatPrice(product.price)} · {product.stock} in stock
                      </p>
                    </div>
                    <div className="col-start-2 flex gap-2 sm:col-auto sm:contents">
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            id: product.id,
                            name: product.name,
                            category: product.category,
                            price: String(product.price),
                            stock: String(product.stock),
                            description: product.description,
                            image_url: product.image_url ?? "",
                          });
                          setPreview(getProductImage(product).src);
                          setFile(null);
                        }}
                        className="rounded-lg border border-border px-3 py-2 text-sm sm:py-1.5 sm:text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete "${product.name}"? This cannot be undone.`)) {
                            removeProduct.mutate(product);
                          }
                        }}
                        className="rounded-lg border border-destructive px-3 py-2 text-sm text-destructive sm:py-1.5 sm:text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <form onSubmit={saveProduct} className="h-fit rounded-lg border border-border bg-card p-4">
              <h2 className="font-display text-base font-semibold">
                {form.id ? "Edit product" : "Add product"}
              </h2>

              <label className="mt-4 block text-sm font-medium" htmlFor="photo">
                Photo (png, jpg, webp — max 5MB)
              </label>
              <input
                id="photo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  setPreview(selected ? URL.createObjectURL(selected) : form.image_url || null);
                }}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
              {preview && (
                <img
                  src={preview}
                  alt="Selected product preview"
                  className="mt-3 h-32 w-32 rounded-md border border-border object-cover"
                />
              )}

              <Field
                label="Name"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                required
              />

              <label className="mt-4 block text-sm font-medium" htmlFor="category">
                Category
              </label>
              {customCategory ? (
                <input
                  id="category"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              ) : (
                <select
                  id="category"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  {categories.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => setCustomCategory((value) => !value)}
                className="mt-2 text-xs text-muted-foreground underline"
              >
                {customCategory ? "Pick from list" : "Type a new category"}
              </button>

              <Field
                label="Price (₦)"
                type="number"
                value={form.price}
                onChange={(value) => setForm({ ...form, price: value })}
                required
              />
              <Field
                label="Stock"
                type="number"
                value={form.stock}
                onChange={(value) => setForm({ ...form, stock: value })}
                required
              />

              <label className="mt-4 block text-sm font-medium" htmlFor="description">
                Description and specifications
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Include condition, storage, battery health, warranty, or key specs as relevant.
              </p>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Example: UK used, 128GB, 89% battery health, Face ID working, 3-month warranty."
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={saving}
                className="mt-5 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
              >
                {saving ? "Saving…" : form.id ? "Save changes" : "Add product"}
              </button>
              {form.id && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...EMPTY_FORM });
                    setPreview(null);
                    setFile(null);
                  }}
                  className="mt-2 w-full rounded-lg border border-border px-4 py-2 text-sm"
                >
                  Cancel edit
                </button>
              )}
            </form>
          </div>
        ) : tab === "orders" ? (
          <OrdersPanel />
        ) : (
          <SettingsForm settings={settings.data} />
        )}
      </div>
    </div>
  );
}

function OrdersPanel() {
  const queryClient = useQueryClient();
  const orders = useQuery(ordersQuery);
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ordersQuery.queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order deleted");
      queryClient.invalidateQueries({ queryKey: ordersQuery.queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (orders.isLoading) return <Skeleton className="h-48 w-full rounded-lg" />;
  if (orders.isError) {
    return (
      <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        Could not load orders. If you just added this feature, apply the order-history database migration in Lovable Cloud first.
      </p>
    );
  }

  if (!orders.data?.length) {
    return (
      <section className="rounded-lg border border-border bg-card px-4 py-12 text-center">
        <h2 className="font-display text-base font-semibold">No orders yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          New orders will appear here after customers submit the order form.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-semibold">Orders ({orders.data.length})</h2>
      {orders.data.map((order) => (
        <OrderRow
          key={order.id}
          order={order}
          saving={updateStatus.isPending || deleteOrder.isPending}
          onStatusChange={(status) => updateStatus.mutate({ id: order.id, status })}
          onDelete={() => {
            if (confirm(`Delete this order from ${order.customer_name}? This cannot be undone.`)) {
              deleteOrder.mutate(order.id);
            }
          }}
        />
      ))}
    </section>
  );
}

function OrderRow({
  order,
  saving,
  onStatusChange,
  onDelete,
}: {
  order: StoreOrder;
  saving: boolean;
  onStatusChange: (status: OrderStatus) => void;
  onDelete: () => void;
}) {
  const phone = order.customer_phone.replace(/\D/g, "");
  const date = new Date(order.created_at).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-display text-base font-semibold">{order.customer_name}</h3>
            <time className="text-xs text-muted-foreground">{date}</time>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{order.customer_phone}</p>
          <ul className="mt-3 space-y-1 text-sm">
            {order.items.map((item) => (
              <li key={`${order.id}-${item.product_id}`} className="break-words">
                {item.name} × {item.quantity} · {formatPrice(item.unit_price * item.quantity, order.currency_symbol)}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-display text-lg font-bold">
            Total: {formatPrice(order.total, order.currency_symbol)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          <label className="sr-only" htmlFor={`order-status-${order.id}`}>Order status</label>
          <select
            id={`order-status-${order.id}`}
            value={order.status}
            disabled={saving}
            onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
            className="min-h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm capitalize"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-success px-3 py-2 text-sm font-medium text-success"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Message customer
          </a>
          <button
            type="button"
            disabled={saving}
            onClick={onDelete}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-destructive px-3 py-2 text-sm font-medium text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete order
          </button>
        </div>
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z]/g, "-");
  return (
    <>
      <label className="mt-4 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
      />
    </>
  );
}

function SettingsForm({ settings }: { settings: Settings | undefined }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Settings | null>(settings ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (!form) return <Skeleton className="h-64 w-full rounded-lg" />;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    const whatsappNumber = form.whatsapp_number.replace(/\D/g, "");
    if (
      whatsappNumber.length < 10 ||
      whatsappNumber.length > 15 ||
      whatsappNumber === LEGACY_WHATSAPP_PLACEHOLDER
    ) {
      toast.error("Enter the store's real WhatsApp number in international format");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("settings")
      .update({
        store_name: form.store_name,
        tagline: form.tagline,
        whatsapp_number: whatsappNumber,
        currency_symbol: form.currency_symbol,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    }
  }

  return (
    <form onSubmit={save} className="max-w-md rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold">Store settings</h2>
      <Field
        label="Store name"
        value={form.store_name}
        onChange={(value) => setForm({ ...form, store_name: value })}
        required
      />
      <Field
        label="Tagline"
        value={form.tagline}
        onChange={(value) => setForm({ ...form, tagline: value })}
        required
      />
      <Field
        label="WhatsApp number (international format)"
        value={form.whatsapp_number}
        onChange={(value) => setForm({ ...form, whatsapp_number: value })}
        required
      />
      <Field
        label="Currency symbol"
        value={form.currency_symbol}
        onChange={(value) => setForm({ ...form, currency_symbol: value })}
        required
      />
      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
