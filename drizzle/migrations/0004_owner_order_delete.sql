GRANT DELETE ON public.orders TO authenticated;

CREATE POLICY "Store owner can delete orders" ON public.orders
FOR DELETE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');