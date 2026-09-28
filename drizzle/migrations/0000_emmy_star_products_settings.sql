CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Owner can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owner can update products" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Owner can delete products" ON public.products FOR DELETE TO authenticated USING (true);

CREATE TABLE public.settings (
  id integer PRIMARY KEY DEFAULT 1,
  store_name text NOT NULL DEFAULT 'Emmy Star',
  tagline text NOT NULL DEFAULT 'Tested and verified gadgets in Nigeria',
  whatsapp_number text NOT NULL DEFAULT '2348012345678',
  currency_symbol text NOT NULL DEFAULT '₦',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are publicly readable" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Owner can insert settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owner can update settings" ON public.settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.settings (id) VALUES (1);

INSERT INTO public.products (name, category, price, stock, description, image_url) VALUES
('iPhone 13 128GB', 'iPhones', 450000, 6, 'Clean UK-used iPhone 13 with 89% battery health, Face ID working, no scratches. Comes with charging cable.', '/__l5e/assets-v1/9a8ca10d-e857-483c-98ea-8b0c57650e1c/product-iphone-1.jpg'),
('iPhone 15 Pro Max 256GB', 'iPhones', 1250000, 2, 'Natural titanium, factory unlocked, 100% battery health. Tested camera, speakers and charging port before sale.', '/__l5e/assets-v1/02810b34-7fbc-43c3-90e4-bd2b88be7a0f/product-iphone-2.jpg'),
('Samsung Galaxy S23 Ultra 256GB', 'Samsung', 780000, 4, 'Green S23 Ultra with S-Pen included. 200MP camera, dual SIM, screen protector already fitted.', '/__l5e/assets-v1/4fa28198-a4ad-4832-a671-73969a2a36ba/product-samsung-1.jpg'),
('Samsung Galaxy S24 Ultra 512GB', 'Samsung', 1150000, 0, 'Phantom black, 512GB storage, 12GB RAM. Fully tested and verified. Restocking soon.', '/__l5e/assets-v1/bb5b8d37-3837-40e4-9a0b-e37709457f1a/product-samsung-2.jpg'),
('MacBook Air M2 13" 256GB', 'Laptops', 980000, 3, 'Silver MacBook Air M2, 8GB RAM, 256GB SSD. Battery cycle count under 120. Perfect for school and work.', '/__l5e/assets-v1/1d09ddc3-fc98-4255-93e4-19fc6e0a52d8/product-laptop-1.jpg'),
('Dell Latitude 7420 i7 16GB', 'Laptops', 520000, 7, 'Business-grade Dell Latitude, Core i7 11th gen, 16GB RAM, 512GB SSD, backlit keyboard.', '/__l5e/assets-v1/7541766a-f3fc-48a7-a1cc-bcc31502db9c/product-laptop-2.jpg'),
('AirPods Pro 2 + USB-C Cable', 'Accessories', 185000, 12, 'Sealed AirPods Pro 2 with active noise cancellation, plus a braided fast-charging cable.', '/__l5e/assets-v1/b7f64d04-9f5b-4b1f-b2e2-6ac5bd0bf562/product-accessory-1.jpg');