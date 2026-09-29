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

- Keep admin and retailer authorization in `public.user_roles`, not the legacy profile role, because roles must remain separately protected.
- Associate guest applications with accounts only during an authorized admin review, because public forms cannot prove user ownership.
- Store guest contact and delivery information with each order, because checkout need not require an account.
- Renew signed product-media URLs when reading products, because previously stored links expire.
