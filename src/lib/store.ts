import { supabase } from "@/integrations/supabase/client";

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
    return (
      (data as Settings) ?? {
        id: 1,
        store_name: "Emmy Star",
        tagline: "Tested and verified gadgets",
        whatsapp_number: "2348012345678",
        currency_symbol: "₦",
      }
    );
  },
};
