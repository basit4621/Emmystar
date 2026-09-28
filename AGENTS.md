<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- Storefront UI lives in `src/components/store/`; shared product/settings queries and formatting live in `src/lib/store.ts` — one source of truth for data access.
- The order list is client state in `src/hooks/useCart.tsx` backed by localStorage, because there is no online checkout.
- Product photos are uploaded to the private `product-images` bucket and stored as long-lived signed URLs, so the bucket stays non-public.
- The home route `/` owns category filtering via the `category` search param; all `Link to="/"` calls must pass `search`.
