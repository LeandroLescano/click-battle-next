# Click Battle Web

This repository is the active production web app for Click Battle.

## Delivery Flow

- Do not push feature work directly to `master`.
- Prefer a dedicated feature branch for each web change.
- Validate branch work first on the Vercel preview URL when available.
- Merge web feature branches into `develop` first.
- Validate integrated changes on `https://dev.click-battle.com.ar/`.
- Only promote validated web changes from `develop` to `master` through a PR.

## Collaboration Preferences

- When using browser-based verification or Playwright, summarize what was tested in Codex. Routine command checks do not need progress narration unless they fail or reveal something important.
- Before running Playwright E2E tests that require logged-in players, run the auth setup first so player credentials exist.
- Treat Vercel previews and sandbox domains as potentially connected to production Firebase unless the environment says otherwise. Call out data-writing or destructive test risks before running them.
- Keep local agent/tool artifacts out of git. `.codex/`, `.impeccable/`, and `.playwright-mcp/` are local working state; `PRODUCT.md` and `DESIGN.md` are the shared design context that belongs in the repo.

## Spec Kit

- Keep repository-specific Spec Kit configuration in `.specify/`.
- Use Spec Kit for feature work in the usual flow: specify -> plan -> tasks -> implement.
- Treat generated specs as product artifacts worth reviewing before implementation.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read specs/002-cleanup-ghost-rooms/plan.md
<!-- SPECKIT END -->
