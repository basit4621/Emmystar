DROP POLICY "Owner can insert products" ON public.products;
DROP POLICY "Owner can update products" ON public.products;
DROP POLICY "Owner can delete products" ON public.products;
DROP POLICY "Owner can insert settings" ON public.settings;
DROP POLICY "Owner can update settings" ON public.settings;
DROP POLICY "Owner can read product images" ON storage.objects;
DROP POLICY "Owner can upload product images" ON storage.objects;
DROP POLICY "Owner can update product images" ON storage.objects;
DROP POLICY "Owner can delete product images" ON storage.objects;

UPDATE public.products
SET image_url = NULL
WHERE image_url LIKE '/__l5e/assets-v1/%';

UPDATE public.settings
SET whatsapp_number = '2348108361022'
WHERE whatsapp_number = '2348012345678';

CREATE POLICY "Store owner can insert products" ON public.products
FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE POLICY "Store owner can update products" ON public.products
FOR UPDATE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE POLICY "Store owner can delete products" ON public.products
FOR DELETE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE POLICY "Store owner can insert settings" ON public.settings
FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE POLICY "Store owner can update settings" ON public.settings
FOR UPDATE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE POLICY "Store owner can read product images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE POLICY "Store owner can upload product images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE POLICY "Store owner can update product images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
WITH CHECK (bucket_id = 'product-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE POLICY "Store owner can delete product images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');