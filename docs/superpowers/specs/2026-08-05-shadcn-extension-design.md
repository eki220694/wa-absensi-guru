# Shadcn/ui Pi Extension — Design Spec

Date: 2026-08-05
Approach: A (Registry-download on demand)

## Purpose

A Pi extension that registers a `/shadcn` command and custom tools to discover,
generate, and install shadcn/ui components into any project from within Pi.

## Architecture

```
Extension entry (~/.pi/agent/extensions/shadcn.ts)
  │
  ├── Registry fetcher (shadcn-registry.json from GitHub API)
  │     URL: https://api.github.com/repos/shadcn/ui/contents registry?ref=main
  │     (or: https://ui.shadcn.com/api/registry/[component])
  │
  ├── Cache layer (TTL 24h, stored at ~/.pi/cache/shadcn-registry.json)
  │
  ├── Component installer
  │     - Fetches component file list + source from registry
  │     - Writes files to target project
  │     - Merges new dependencies into package.json
  │
  └── Pi API integration
        - pi.registerTool("shadcn_add", ...)
        - pi.registerCommand("shadcn", ...)
```

## Capabilities (v1)

### Commands

- `/shadcn list` — Fetch & cache registry, display component names + descriptions.
- `/shadcn show <name>` — Print component files, dependencies, registry deps.
- `/shadcn add <name> [--path <dir>]` — Install component to cwd (or given path).

### Tools (LLM-callable)

- `shadcn_add` — Install a shadcn/ui component. Params: `component` (string), `path` (optional).
- `shadcn_list` — List available components (returns JSON).
- `shadcn_show` — Show component details (returns JSON with files + deps).

## Registry Source

Two possible sources:
1. GitHub API: `https://raw.githubusercontent.com/shadcn/ui/main/registry.json`
   - Contains component metadata including file paths.
2. Component files: fetched from
   `https://raw.githubusercontent.com/shadcn/ui/main/registry/<component>/<file>`
3. Fallback: use `https://ui.shadcn.com/api/registry/<component>` API if GitHub
   raw URLs fail.

Cache stored at `~/.pi/cache/shadcn-registry.json` with 24h TTL.

## Component Installer

1. Resolve component from registry metadata.
2. Fetch each file's source content (registry deps included if `--all` flag or
   by default for required deps).
3. Write files to `<project>/components/ui/<component>.tsx` (default).
4. Read target `package.json`, add any new dependencies:
   - `clsx`, `tailwind-merge` (always present, but ensure).
   - `@radix-ui/react-*` deps as listed in registry.
5. Use `ctx.ui.select()` / `ctx.ui.notify()` for user feedback.
6. Print summary of installed files + required npm packages.

## State Management

- Registry cache: `~/.pi/cache/shadcn-registry.json` (TTL 24h).
- No other persistent state needed — extension is stateless between calls.

## Non-Goals (v1)

- Component customization / variants.
- Monorepo workspace detection.
- Tailwind config detection / merging.
- shadcn/ui v4 support (if released).
- Interactive component picker UI (TUI widget).

## Dependencies

- `node-fetch` or native `fetch` (Node 20+ has fetch). Use native fetch — zero deps.
- No external npm packages required beyond what Pi provides.

## Error Handling

- Network failure: fall back to cached registry if available, else error.
- Component not found: return clear error + suggestion.
- Write failure (permissions): report via `ctx.ui.notify("error", ...)`.
- Duplicate install: warn, offer to overwrite.

## Testing

- One self-check in the extension file: assert `getRegistry()` returns expected
  shape `{ name, components: Array<{ name, files, deps }> }`.
