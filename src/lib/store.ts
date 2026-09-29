import { supabase } from "@/integrations/supabase/client";
import categoryIphonesImage from "@/assets/iphone-product-photo.jpg";
import categorySamsungImage from "@/assets/cat-samsung.jpg";
import categoryLaptopsImage from "@/assets/cat-laptops.jpg";
import categoryAccessoriesImage from "@/assets/trust-store.jpg";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image_url: string | null;
  created_at: string;
};

export type Settings = {
  id: number;
  store_name: string;
  tagline: string;
  whatsapp_number: string;
  currency_symbol: string;
};

export type OrderStatus = "new" | "contacted" | "completed" | "cancelled";

export type OrderLine = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
};

export type StoreOrder = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  items: OrderLine[];
  total: number;
  currency_symbol: string;
  status: OrderStatus;
};

export const DEFAULT_WHATSAPP_NUMBER = "2348108361022";
export const LEGACY_WHATSAPP_PLACEHOLDER = "2348012345678";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  iPhones: categoryIphonesImage,
  Samsung: categorySamsungImage,
  Laptops: categoryLaptopsImage,
  Accessories: categoryAccessoriesImage,
};

export function getProductImage(product: Pick<Product, "image_url" | "category">) {
  const imageUrl = product.image_url;
  if (imageUrl && !imageUrl.startsWith("/__l5e/assets-v1/")) {
    return { src: imageUrl, isFallback: false };
  }

  return {
    src: CATEGORY_FALLBACK_IMAGES[product.category] ?? categoryAccessoriesImage,
    isFallback: true,
  };
}

export const CATEGORIES = ["iPhones", "Samsung", "Laptops", "Accessories"];

export function formatPrice(value: number, symbol = "₦") {
  return `${symbol}${value.toLocaleString("en-NG")}`;
}

export const productsQuery = {
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Product[];
  },
};

export const settingsQuery = {
  queryKey: ["settings"],
  queryFn: async (): Promise<Settings> => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const settings = data as Settings;
      return {
        ...settings,
        whatsapp_number:
          settings.whatsapp_number === LEGACY_WHATSAPP_PLACEHOLDER
            ? DEFAULT_WHATSAPP_NUMBER
            : settings.whatsapp_number,
      };
    }

    return {
        id: 1,
        store_name: "Emmy Star",
        tagline: "Tested and verified gadgets",
        whatsapp_number: DEFAULT_WHATSAPP_NUMBER,
        currency_symbol: "₦",
    };
  },
};

export const ordersQuery = {
  queryKey: ["orders"],
  queryFn: async (): Promise<StoreOrder[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as StoreOrder[];
  },
};
