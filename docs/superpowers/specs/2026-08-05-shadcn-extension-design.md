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
  ├── Registry fetcher (GET raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry.json)
  │     Returns { name, items: [{ name, type, description, files[], registryDependencies, dependencies }] }
  │     54 UI components, 411 total items
  │
  ├── Cache layer (TTL 24h, stored at ~/.pi/cache/shadcn-registry.json)
  │
  ├── Component installer
  │     - Fetch files from raw.githubusercontent.com/shadcn-ui/ui/main/{path}
  │     - Write to <target>/components/ui/<name>.tsx
  │     - Resolve registryDependencies recursively (e.g. utils → lib/utils.ts)
  │     - Merge npm dependencies into package.json
  │
  └── Pi API integration
        - pi.registerTool("shadcn_add", "shadcn_list", "shadcn_show")
        - pi.registerCommand("shadcn", sub-commands: list/show/add)
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

Verified structure from `https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry.json`:

```json
{ "name": "shadcn/ui", "items": [
  { "name": "accordion", "type": "registry:ui",
    "files": [{ "path": "registry/new-york-v4/ui/accordion.tsx", "type": "registry:ui" }],
    "registryDependencies": null,
    "dependencies": ["@radix-ui/react-accordion"] },
  { "name": "utils", "type": "registry:lib",
    "files": [{ "path": "registry/new-york-v4/lib/utils.ts", "type": "registry:lib" }],
    "dependencies": ["clsx", "tailwind-merge"] }
]}
```

- `type` values: `registry:ui` (components), `registry:style`, `registry:hook`, `registry:lib`
- 54 `registry:ui` components, 411 total items
- File content fetched from `https://raw.githubusercontent.com/shadcn-ui/ui/main/{file.path}`
- `registryDependencies` are other registry item names (resolve recursively)
- `dependencies` are npm packages (add to package.json)
- Cache stored at `~/.pi/cache/shadcn-registry.json` with 24h TTL

## Component Installer

1. Resolve component from registry metadata.
2. Fetch each file's source content (registry deps included if `--all` flag or
   by default for required deps).
3. Write files to `<project>/components/ui/<component>.tsx` (default).
4. Read target `package.json`, add any new npm `dependencies` from the component and its `registryDependencies` (resolved recursively). This includes `@radix-ui/react-*`, `clsx`, `tailwind-merge`, `lucide-react`, `class-variance-authority`, etc.
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

- Native `fetch` (Node 20+ bundled with Pi). Zero npm deps required.
- No external packages beyond what Pi environment provides.

## Error Handling

- Network failure: fall back to cached registry if available, else error with message.
- Component not found: suggest `shadcn list` to see valid names.
- Write failure (permissions): report via `ctx.ui.notify("error", ...)`.
- Duplicate install: warn, offer to overwrite.

## Testing

- One self-check in the extension: assert `getRegistry()` returns array items with shape `{ name: string, type: string, files: Array<{ path: string }> }`.
