import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StarLogo } from "@/components/store/StarLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  formatPrice,
  productsQuery,
  settingsQuery,
  type Product,
  type Settings,
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
  category: CATEGORIES[0],
  price: "",
  stock: "",
  description: "",
  image_url: "",
};

function Admin() {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(Boolean(next));
    });
    supabase.auth.getSession().then(({ data: current }) => {
      setSession(Boolean(current.session));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  return session ? <Dashboard /> : <LoginCard />;
}

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back");
  }

  async function register() {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created. Check your email to confirm, then sign in.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <StarLogo className="h-6 w-6 text-accent" />
          <span className="font-display text-lg font-bold">Emmy Star admin</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Store owner sign in.</p>

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
          Sign in
        </button>
        <button
          type="button"
          onClick={register}
          disabled={busy}
          className="mt-2 w-full rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
        >
          Create owner account
        </button>
        <Link to="/" className="mt-4 block text-center text-sm text-muted-foreground">
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
  const [tab, setTab] = useState<"products" | "settings">("products");
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
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-4">
          <StarLogo className="h-5 w-5 text-accent" />
          <span className="font-display text-base font-bold">Emmy Star admin</span>
          <Link to="/" className="ml-auto text-sm text-muted-foreground">
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
          {(["products", "settings"] as const).map((name) => (
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
                    className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category} · {formatPrice(product.price)} · {product.stock} in stock
                      </p>
                    </div>
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
                        setPreview(product.image_url);
                        setFile(null);
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
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
                      className="rounded-lg border border-destructive px-3 py-1.5 text-xs text-destructive"
                    >
                      Delete
                    </button>
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
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
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
        ) : (
          <SettingsForm settings={settings.data} />
        )}
      </div>
    </div>
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

function SettingsForm({ settings }: { settings?: Settings }) {
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
    setSaving(true);
    const { error } = await supabase
      .from("settings")
      .update({
        store_name: form.store_name,
        tagline: form.tagline,
        whatsapp_number: form.whatsapp_number.replace(/\D/g, ""),
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
        label="WhatsApp number"
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
