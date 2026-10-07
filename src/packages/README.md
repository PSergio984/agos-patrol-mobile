# Packages are deep modules

Every directory here is a **deep module**: a lot of behaviour behind a small interface. A package's public surface is its **entry points** — the files at the package root. Everything in a subfolder is private.

```
src/packages/
  <name>/
    index.ts        ← an entry point (public). Import this from outside.
    client.ts       ← another entry point. Packages may expose SEVERAL.
    lib/            ← implementation: hidden from outside, free to import each other.
    tests/          ← co-located tests + fixtures (a subfolder, so private).
```

Copy `example/` when starting a new package.

**Discourage barrel files**: expose several small entry points (`index.ts`, `client.ts`) rather than re-exporting a whole subtree through one giant index. Adding an entry point = adding a root file.

## Rules (enforced by dependency-cruiser, `npm run lint:boundaries`)

1. **Entry-point boundary** — code outside a package may import only its entry points (root files), never subfolder internals.
2. **Intra-package freedom** — a package's own files import each other freely.
3. **Tests through entry points** — `tests/` files import entry points and their own fixtures only; never any package's internals, not even their own.
4. **No cycles** — no dependency cycles.

Config: [`.dependency-cruiser.cjs`](../../.dependency-cruiser.cjs). Layering rules (which packages may depend on which) are a commented stub there — add when needed.

## Check it

```bash
npm run lint:boundaries
```
