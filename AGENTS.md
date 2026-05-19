# Click Battle Web

This repository is the active production web app for Click Battle.

## Delivery Flow

- Do not push feature work directly to `master`.
- Prefer a dedicated feature branch for each web change.
- Validate branch work first on the Vercel preview URL when available.
- Merge web feature branches into `develop` first.
- Validate integrated changes on `https://dev.click-battle.com.ar/`.
- Only promote validated web changes from `develop` to `master` through a PR.

## Spec Kit

- Keep repository-specific Spec Kit configuration in `.specify/`.
- Use Spec Kit for feature work in the usual flow: specify -> plan -> tasks -> implement.
- Treat generated specs as product artifacts worth reviewing before implementation.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
