# Telegram Webhook 500 Debug Report

**Date:** 2026-07-31
**Commit:** `222a5f4` (fix: replace b.filter async predicate with b.hears)

## Root Cause

**`b.filter()` async predicate anti-pattern** — the `b.filter(async (ctx) => {...})` handler ran command handlers (cmdAbsen, cmdJadwal, etc.) as side effects inside a filter predicate, then always returned `true` causing double execution via `:text` handler. The async predicate had no error boundary, so any throw propagated as unhandled rejection.

**Missing `b.catch()` error handler** — no global error handler on the bot instance meant unhandled middleware errors crashed the update with 500.

**`getBot()` used non-null assertion (`TELEGRAM_BOT_TOKEN!`)** — no validation that the token was set before creating Bot instance.

## Fixes Applied

### 1. `web/src/lib/telegram.ts`

- **`getBot()`**: Added explicit token validation — throws `TELEGRAM_BOT_TOKEN not set` instead of silent undefined
- **`b.filter()` → `b.hears()`**: Replaced async filter predicate anti-pattern with proper `b.hears()` handlers for keyboard buttons. Each button has its own middleware chain with proper error boundaries.
- **`b.catch()`**: Added global error handler to catch unhandled middleware errors

### 2. `web/src/app/api/telegram/route.ts`

- Added logging: bot init status, bot username, update type/text summary
- Returns `200` on error (prevents Telegram from retrying endlessly)

## Test Results

- ✅ `POST /api/telegram` with `/start` → `{"ok":true}`
- ✅ `POST /api/telegram` with keyboard button "✅ Absen" → `{"ok":true}`
- ✅ `getWebhookInfo` → `pending_update_count: 0`, no errors

## Key Learnings

1. Grammy v3 `filter()` with async predicates is an anti-pattern — use `hears()` for text matching
2. Always add `b.catch()` error handler on Grammy bot instances
3. Vercel returns 200 for the route — if Telegram sees 500 it retries indefinitely
4. The `b.filter()` returning `true` for ALL messages caused every text to execute through both filter AND `:text` handler
