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

- Excel membership import uses shared Zod validation and server-side Auth provisioning with rollback, preserving the administrator session and enforcing membership limits through the existing provisioning RPC.
- Static installations send Excel provisioning to the platform API; local installations use a server function backed by the same authorized helper, keeping service credentials out of the browser.
