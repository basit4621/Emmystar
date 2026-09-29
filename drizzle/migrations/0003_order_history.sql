CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL CHECK (length(trim(customer_name)) BETWEEN 1 AND 120),
  customer_phone text NOT NULL CHECK (length(trim(customer_phone)) BETWEEN 7 AND 30),
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0),
  total integer NOT NULL CHECK (total >= 0),
  currency_symbol text NOT NULL DEFAULT '₦',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed', 'cancelled'))
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT UPDATE (status) ON public.orders TO authenticated;

CREATE POLICY "Customers can create orders" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (status = 'new');

CREATE POLICY "Store owner can read orders" ON public.orders
FOR SELECT TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE POLICY "Store owner can update orders" ON public.orders
FOR UPDATE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner');

CREATE FUNCTION public.validate_order_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_line jsonb;
  product_row public.products%ROWTYPE;
  product_id_value uuid;
  quantity_value integer;
  submitted_price integer;
  requested_quantity integer;
  available_stock integer;
  calculated_total bigint := 0;
BEGIN
  IF jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  FOR order_line IN SELECT entry.value FROM jsonb_array_elements(NEW.items) AS entry(value) LOOP
    IF jsonb_typeof(order_line) <> 'object' THEN
      RAISE EXCEPTION 'Invalid order item';
    END IF;

    BEGIN
      product_id_value := (order_line->>'product_id')::uuid;
      quantity_value := (order_line->>'quantity')::integer;
      submitted_price := (order_line->>'unit_price')::integer;
    EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RAISE EXCEPTION 'Invalid order item values';
    END;

    SELECT * INTO product_row
    FROM public.products
    WHERE id = product_id_value
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product in this order is no longer available';
    END IF;
    IF quantity_value < 1 OR submitted_price <> product_row.price OR order_line->>'name' <> product_row.name THEN
      RAISE EXCEPTION 'An order item no longer matches the product listing';
    END IF;

    calculated_total := calculated_total + (product_row.price::bigint * quantity_value);
  END LOOP;

  FOR product_id_value IN
    SELECT (entry.value->>'product_id')::uuid
    FROM jsonb_array_elements(NEW.items) AS entry(value)
    GROUP BY (entry.value->>'product_id')::uuid
  LOOP
    SELECT stock INTO available_stock
    FROM public.products
    WHERE id = product_id_value
    FOR SHARE;

    SELECT sum((entry.value->>'quantity')::integer)::integer INTO requested_quantity
    FROM jsonb_array_elements(NEW.items) AS entry(value)
    WHERE (entry.value->>'product_id')::uuid = product_id_value;

    IF requested_quantity > available_stock THEN
      RAISE EXCEPTION 'Order quantity exceeds available stock';
    END IF;
  END LOOP;

  IF calculated_total <> NEW.total THEN
    RAISE EXCEPTION 'Order total does not match its items';
  END IF;

  SELECT currency_symbol INTO NEW.currency_symbol
  FROM public.settings
  WHERE id = 1;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_snapshot_before_insert
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_snapshot();

CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);