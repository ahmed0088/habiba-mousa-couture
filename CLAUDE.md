# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A two-page reservation/inquiry site for "Habiba Mousa Couture" (Arabic-first, bilingual AR/EN):
- `index.html` + `app.js` — public gallery of pieces + a "Request This Design" inquiry form (no payment, just writes an inquiry to Firestore)
- `admin.html` + `admin.js` — staff dashboard to manage the product catalog and incoming requests, gated by Firebase Auth + a Firestore `staff` roster

No build step, no bundler, no package manager for the front end — plain HTML/CSS/JS loaded directly via `<script>` tags, using the Firebase compat SDK from a CDN. Firebase (Firestore + Auth) is the primary backend, plus one Cloud Function (`functions/`) for the one operation the client genuinely can't do itself: creating another person's Auth login (see "Staff onboarding" below). The front end has no build step; `functions/` is an ordinary Node project deployed separately via `firebase deploy --only functions` and doesn't affect how `index.html`/`admin.html` are served.

## Commands

There is no build/lint/test tooling in this repo (no `package.json`). To run the site locally:

```bash
python -m http.server 8080
```

(This matches the `.claude/launch.json` dev-server config — port 8080, static file serving, no compilation step needed.)

To deploy, per [README.md](README.md):
```bash
firebase deploy   # after `firebase login`; firebase.json/.firebaserc are already checked in
```
The first deploy of the Cloud Function needs `cd functions && npm install` once, and the Firebase project on the Blaze (pay-as-you-go) plan — Cloud Functions require it regardless of actual usage/cost.

## Architecture

**Data flow is entirely client → Firestore**, with no server code. `firebase-config.js` initializes the Firebase app and exposes two globals, `db` (Firestore) and `auth` (Auth), that `app.js` and `admin.js` both depend on — it must load before them.

**Collections** (see README.md's "Data model reference" for full field lists):
- `products` — catalog pieces (`status: active|archived` controls public visibility)
- `requests` — client inquiries, with a status pipeline: `new` → `contacted` → `confirmed` → `in_progress` → `delivered`/`cancelled`
- `staff` — doc ID **must equal the Firebase Auth UID**; `role: admin|staff`. This is what `firestore.rules` checks to gate all writes and most reads. Created automatically (Auth user + this doc, atomically) by the `createStaffMember` Cloud Function when an admin uses "Add Staff Member" in the dashboard — see "Staff onboarding" below.
- `staff_pending` — legacy from the old manual invite flow; no longer written to by the app. Any existing docs are inert leftovers, not real access grants — don't build on this collection.

**Access control lives in `firestore.rules`**, not in the client code — `app.js`/`admin.js` UI gating is convenience only. Key invariants: public read on `products` and public create on `requests`; everything else requires `isStaff()` (a `staff/{uid}` doc exists) or `isAdmin()` (that doc's `role == 'admin'`). Any change to permissions must be made here and re-published via Firebase Console → Firestore → Rules (there's no CLI/CI deploy for rules in this repo).

**Realtime rendering**: both pages use Firestore `.onSnapshot()` listeners (not one-off `.get()`) for `products`/`requests`/`staff`, so the UI updates live without a page refresh when data changes.

**i18n (`i18n.js`)** is shared by both pages. Arabic is the default/fallback language (`getLang()` defaults to `"ar"`); `t(key)` falls back to English if a key is missing from the active language, then to the raw key. Static markup uses `data-i18n` / `data-i18n-html` / `data-i18n-placeholder` attributes, applied by `applyLanguage()`. Anything rendered dynamically in JS (gallery cards, filter chips, table rows) is **not** covered by those attributes and must be manually translated with `t()` — and re-rendered on the `langchange` custom event that `applyLanguage()` dispatches (see the `document.addEventListener("langchange", ...)` handlers in `app.js`). When adding new UI strings, add matching keys under both `I18N.ar` and `I18N.en` in `i18n.js`, since the two locales are hand-kept in sync there (no external translation files).

**XSS**: all dynamic HTML in `app.js`/`admin.js` that embeds user-controlled or Firestore-sourced data goes through the local `escapeHtml()` helper (defined separately in each file) before being inserted via `innerHTML`. Preserve this pattern for any new dynamic rendering.

**Staff onboarding** is fully self-service from the dashboard (Staff → + Add Staff Member) for anyone who is already an admin, via the `createStaffMember` callable Cloud Function (`functions/index.js`): it verifies the caller is an admin, creates (or reuses) the Firebase Auth user for the given email via the Admin SDK, writes the matching `staff/{uid}` doc immediately, and triggers Firebase Auth's built-in "reset your password" email via the Identity Toolkit REST API (`accounts:sendOobCode`) — no third-party email service configured or needed. The *very first* admin account still has to be created manually via Firebase Console (chicken-and-egg: someone has to be an admin before they can call the function) — see README.md § "Create your first staff login (yourself)".
