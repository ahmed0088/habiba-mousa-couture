# Habiba Mousa — Reservation & Inquiry Site

A two-part site:
- **`index.html`** — public gallery, a product detail view (with image carousel), and a "Request This Design" form (writes to Firestore, no payment). Clients can optionally create an account to track the status of their own requests ("My Requests").
- **`admin.html`** — staff dashboard to manage the catalog and incoming requests
- **`about.html` / `faq.html` / `contact.html` / `terms.html`** — static content pages, sharing the same header/footer/account controls as `index.html`

No build step. Plain HTML/CSS/JS + Firebase (same approach as your other Firebase-based tools), so you can open it locally or drop it straight onto Firebase Hosting.

---

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Inside the project, add a **Web app** (</> icon) — this gives you the config object
3. Copy that config into `firebase-config.js`, replacing the placeholder values

## 2. Turn on the services you need

In the Firebase Console:
- **Firestore Database** → Create database → Start in production mode
- **Authentication** → Sign-in method → enable **Email/Password**
- **Authentication** → Sign-in method → enable **Google** (optional, for the "Continue with Google" button — without this the button shows a clear error instead of failing silently)

## 3. Deploy the security rules

Copy the contents of `firestore.rules` into **Firestore → Rules** in the console, and click Publish.
This makes sure:
- Anyone can browse products and submit a request (no login needed)
- A signed-in client can read (only) their own requests, tracked via `requests.clientUid`
- Only signed-in staff (listed in the `staff` collection) can view/update all requests, manage products, or edit the catalog
- Only `role: admin` staff can manage other staff

Client accounts use the same Firebase Auth (Email/Password) provider as staff — no extra service to enable. A client account is just a regular Auth user with no matching `staff` doc, so it never gains dashboard access.

### A note on Firestore indexes

Rules control *who* can read something; **indexes** control whether a specific query is even allowed to run. Any query that combines a `where(...)` on one field with an `orderBy(...)` on a *different* field needs a composite index — Firestore won't create these automatically. If a feature that reads from Firestore silently shows "empty" or logs a `failed-precondition` error in the browser console, this is almost always why:

- **"My Requests"** (`requests` filtered by `clientUid`, ordered by `createdAt`) needs a composite index: collection `requests`, fields `clientUid` (Ascending) + `createdAt` (Descending).
- The easiest way to create it: sign in as a test client, open "My Requests", open the browser console (F12) — Firestore prints a direct link that pre-fills the index for you. Click it, then click **Create Index** on the page that opens, and wait a couple of minutes for it to finish building.
- Alternatively, create it by hand in **Firestore Database → Indexes → Composite → Add Index** using the field list above.
- (The public product/collection listings were written to avoid needing this entirely — they filter `status == "active"` in the browser instead of in the query — so they don't have this requirement.)

## 4. Create your first staff login (yourself)

The admin dashboard checks two things: a Firebase **Auth** login, and a matching doc in the **`staff`** Firestore collection with the same ID as that user's UID. For your first account:

1. **Authentication → Users → Add user** — create yourself with an email + password
2. Copy the **User UID** shown next to your new user
3. **Firestore Database → Start collection** → collection ID: `staff`
4. Document ID: paste the UID you copied
5. Fields:
   - `name` (string) — your name
   - `email` (string) — same email as the login
   - `role` (string) — `admin`

Now sign in at `admin.html` with that email/password.

This manual bootstrap (steps 1–5) is only needed for your very first admin account, since it's what lets you add everyone else from inside the dashboard.

### Adding more staff later
Once you have at least one admin account, adding staff is fully self-service: **Staff → + Add Staff Member**, enter their email/name/role, and submit. A Cloud Function (`functions/index.js`, `createStaffMember`) creates their Firebase Auth login, creates the matching `staff` doc keyed by the new UID, and emails them a link to set their password — no manual Firebase Console steps or UID copy-pasting. See "Deploy the site" below for the one-time step to deploy that function.

## 5. Add your first products

Once signed in to `admin.html` → **Products** → **+ Add Piece**. Fields:
- Name, category, price range, description
- Image URLs — paste one hosted image link per line (e.g. Firebase Storage URLs, or any hosted image link). The first line is the cover image used in the gallery; all lines feed the image carousel on the public product detail view. Direct image upload from the dashboard can be added as a next step if useful.
- Status `active` makes it visible on the public site immediately (it's a live listener, no refresh needed)

## 6. Deploy the site

`firebase.json` and `.firebaserc` are already checked in, so there's no `firebase init` step needed:

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

That deploys both the static site (Hosting) and the `createStaffMember` Cloud Function. The **first** time you deploy the function, you'll need:
- The **Blaze (pay-as-you-go)** plan on the Firebase project — Cloud Functions require it even though this function's actual usage cost is $0/month for a small team (it only runs when you add a staff member)
- `cd functions && npm install` once, so its dependencies are available to deploy

To redeploy only the site (skipping functions) after a front-end-only change: `firebase deploy --only hosting`. To redeploy only the function: `firebase deploy --only functions`.

You'll get a live URL like `habiba-mousa-couture.web.app` — that's what you link from the Instagram bio.

## Data model reference

**`products`**
| field | type | notes |
|---|---|---|
| name | string | |
| productCode | string | e.g. "HM-1024" — auto-suggested (editable) when creating a new piece, for identifying/tracking physical garments |
| category | string | tag from a suggested list (Admin has an editable dropdown with common presets), but any custom value can be typed too |
| collectionId | string \| null | references a `collections` doc — assigns the piece to a seasonal drop |
| description | string | |
| priceRange | string | free text, e.g. "1,800 – 2,600 EGP" |
| salePrice | string | optional; non-empty means the piece is on sale — shown struck-through next to `priceRange` on the public site |
| images | array of strings | image URLs — first is the cover image, all feed the product detail carousel |
| imageFocus | string | `top` (default) / `center` / `bottom` — which part of the photo stays visible when cropped to the thumbnail frame |
| status | string | `active` or `archived` |
| createdAt | timestamp | server-set |

**`collections`**
| field | type | notes |
|---|---|---|
| name | string | free text, e.g. "Autumn 2026", "Ramadan 2026" |
| status | string | `active` (shows in the public collection picker) or `archived` |
| createdAt | timestamp | server-set |

**`requests`**
| field | type | notes |
|---|---|---|
| clientName | string | |
| clientPhone | string | |
| clientAddress | string | optional; governorate/city/street in Egypt |
| clientLocationUrl | string \| null | optional Google Maps link (`?q=lat,lng`) from the client's own device via the "Share my location" button — no typing needed |
| material | string | one of the fixed material keys (`silk`, `chiffon`, `satin`, `lace`, `cotton`, `crepe`, `tulle`, `organza`, `velvet`, `brocade`, `unspecified`) chosen from a dropdown — no free typing |
| productId / productName / productCode | string | which piece they're asking about |
| preferredDate | string | optional |
| notes | string | |
| status | string | `new` → `contacted` → `confirmed` → `in_progress` → `delivered` / `cancelled` |
| clientUid | string \| null | set when submitted while signed in; lets that client read (only) this request back in "My Requests" |
| createdAt | timestamp | server-set |

**`clients`** (one doc per signed-up client)
| field | type | notes |
|---|---|---|
| doc ID | — | must equal the client's Firebase Auth UID |
| name | string | from sign-up form, or Google account display name |
| email | string | |
| phone | string | captured at sign-up; for Google sign-in, collected via a "Complete your profile" prompt shown once after first sign-in |
| createdAt | timestamp | server-set |

**`staff`**
| field | type | notes |
|---|---|---|
| doc ID | — | must equal the person's Firebase Auth UID |
| name | string | |
| email | string | |
| role | string | `admin` or `staff` |

**`activityLog`** (append-only; any staff can add/read, nothing can be edited or deleted)
| field | type | notes |
|---|---|---|
| action | string | e.g. "Deleted request", "Updated product", "Invited staff member" |
| target | string | free text — whatever identifies what was acted on (name, status change, etc.) |
| actor | string | the signed-in staff member's name or email at the time |
| createdAt | timestamp | server-set |

**`settings/site`** (singleton doc, edited from Admin → Settings)
| field | type | notes |
|---|---|---|
| heroTagline_ar / heroTagline_en | string | overrides the homepage hero subtitle |
| turnaround_ar / turnaround_en | string | overrides the "turnaround time" spec on the homepage |
| aboutIntro_ar / aboutIntro_en | string | overrides the About page intro paragraph |
| aboutStory_ar / aboutStory_en | string | overrides the About page story paragraph |
| contactPhone | string | |
| contactWhatsapp | string | digits only, used to build the wa.me link |
| contactEmail | string | |
| contactHours_ar / contactHours_en | string | |
| address_ar / address_en | string | |
| googleMapsUrl | string | Maps button on `contact.html` is hidden until this is set |
| wazeUrl | string | Waze button on `contact.html` is hidden until this is set |
| depositPercent | number | defaults to 40 if unset; interpolated into the Terms page's deposit paragraph |

All fields fall back to the site's built-in copy/defaults when blank, so the site works correctly before any of this is filled in.

## Natural next steps (not built yet, flag if you want these)
- Direct image upload to Firebase Storage from the admin panel (right now it's pasted URLs)
- WhatsApp/email/Telegram auto-notification via a Cloud Function when a new request lands
- Letting a client edit or cancel their own pending request from "My Requests" (currently view-only)
- Real address/hours/contact details are placeholders until filled in via Admin → Settings
- Numeric pricing (currently free text) if you ever want an automatically-calculated discount % instead of a manually-typed sale price
