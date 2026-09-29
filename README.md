# Vivid Visions

add lot of image to make it visually apealing

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Use Node.js 22.12 or newer (`nvm install` reads `.nvmrc`). Configure `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` in
`.env` before starting the app.

## Store Setup

1. Set `LOVABLE_DB_MIGRATION_URL` to the project's PostgreSQL connection string and run
	`npx drizzle-kit migrate` to apply pending database migrations.
2. In Supabase SQL Editor, grant owner access to the intended Auth user. Replace the email
	with the store owner's account, then sign out and back in so the new claim is in the JWT:

	```sql
	UPDATE auth.users
	SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"owner"}'::jsonb
	WHERE email = 'owner@example.com';
	```

	Do not put this role in `user_metadata`; users can change that themselves.
3. In the admin Settings tab, replace the example WhatsApp number with the store's real number
	in international format, then add real product photos. Seed image links from the preview
	asset proxy are not portable; category photos are shown until each product has an uploaded photo.
4. To enable customer order history, apply `drizzle/migrations/0003_order_history.sql` and then
	`drizzle/migrations/0004_owner_order_delete.sql` in order in the Lovable Cloud SQL editor.
	Customers can then save an order before continuing to WhatsApp; only the store owner can view,
	update, or delete orders in the admin Orders tab.

The admin route and database write policies require the trusted `app_metadata.role = "owner"` claim.
