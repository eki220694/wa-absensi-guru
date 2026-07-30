# Bot Fix Report

## Root Cause

**`loadSession(chatId)` throwing → 500 → keyboard buttons dead.**

Flow:
1. User presses `✅ Absen` (keyboard button)
2. Telegram sends text message `✅ Absen` to webhook
3. `b.on(':text')` handler fires
4. **Line 205** (original): `const s = await loadSession(chatId)` — SQL query `SELECT data FROM bot_session WHERE chat_id = ...`
5. If `bot_session` table missing/DB error → exception thrown → handler crashes → webhook returns 500
6. Keyboard button checks on lines 207-211 **never reached** because crash happens before them

`/start` works because `cmdStart` (registered via `b.command('start')`) doesn't touch `bot_session`.

## Strategy: Filter-Based Intercept (Strategy A)

**Chosen: `b.filter()` middleware registered BEFORE `b.on(':text')`.**

Alasan:
- **Independent of `loadSession`** — filter only reads `ctx.message.text`, no DB call
- **Stops propagation** — returns `true` to tell Grammy "handled, don't continue"
- **Clean separation** — keyboard buttons handled by filter, session flows handled by `:text`
- **Defense in depth** — `:text` handler also has `loadSession` wrapped in try/catch now

## Changes Made

**File:** `web/src/lib/telegram.ts`

### 1. Added `b.filter()` handler (line ~197)
```typescript
b.filter(async (ctx) => {
  if (!ctx.message?.text) return false;
  const t = ctx.message.text;
  if (t === '✅ Absen') { await cmdAbsen(ctx); return true; }
  if (t === '📋 Jadwal') { await cmdJadwal(ctx); return true; }
  if (t === '🏖 Izin') { await cmdIzin(ctx); return true; }
  if (t === '📊 Cek Absen') { await cmdCek(ctx); return true; }
  if (t === '❓ Bantuan') { await cmdHelp(ctx); return true; }
  return false;
});
```
Registered between `:photo` handler and `:text` handler.

### 2. Removed keyboard button checks from `b.on(':text')`
Original lines `if (t === '✅ Absen') return cmdAbsen(ctx);` etc. removed — now handled by filter.

### 3. Wrapped `loadSession` in try/catch
```typescript
let s: Session;
try {
  s = await loadSession(chatId);
} catch {
  s = emptySession();
}
```
Prevents DB errors from crashing the handler.

## Results

| Check | Status |
|-------|--------|
| `tsc --noEmit` | ✅ No errors |
| `npm run build` | ✅ Compiled successfully |

## Deployment Note

If `bot_session` table doesn't exist, run migration:
```
npm run db:migrate
```
But the fix works even without it — keyboard buttons bypass `loadSession` entirely via the filter.
