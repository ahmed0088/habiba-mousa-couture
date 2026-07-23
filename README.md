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

### Adding more staff later
Ask the person to sign up for a regular client account on the public site first (Sign Up, on the account menu) — this creates their Auth login and a matching `clients` doc automatically. Then in `admin.html` → **Staff** → **+ Add Staff Member**, type their email; the form looks it up in `clients` and, once found, grants dashboard access directly using their real UID — no manual Firebase Console step needed. If no matching account is found, they need to sign up first.

## 5. Add your first products

Once signed in to `admin.html` → **Products** → **+ Add Piece**. Fields:
- Name, category, price range, description
- Image URLs — paste one hosted image link per line (e.g. Firebase Storage URLs, or any hosted image link). The first line is the cover image used in the gallery; all lines feed the image carousel on the public product detail view. Direct image upload from the dashboard can be added as a next step if useful.
- Status `active` makes it visible on the public site immediately (it's a live listener, no refresh needed)

## 6. Deploy the site

Easiest path — Firebase Hosting (free tier is generous for this use case):

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project, set public directory to this folder, single-page app: No
firebase deploy
```

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
| availability | string | `made_to_order` (default — client submits a custom request) or `ready_stock` (in-stock item sold via `variants`) |
| variants | array of `{size, color, stock}` | only used when `availability` is `ready_stock`; size/color are optional free text (blank if the item doesn't come in that dimension), stock is the quantity on hand for that combination |
| createdAt | timestamp | server-set |

**`collections`**
| field | type | notes |
|---|---|---|
| name | string | free text, e.g. "Autumn 2026", "Ramadan 2026" |
| status | string | `active` (shows in the public collection picker) or `archived` |
| createdAt | timestamp | server-set |

**`videos`**
| field | type | notes |
|---|---|---|
| title | string \| null | optional caption shown under the embedded player |
| url | string | the original YouTube/Vimeo link staff pasted in |
| embedUrl | string | `url` converted to its iframe-embeddable form (computed once at save time) |
| status | string | `active` (shows in the public Videos section) or `archived` |
| createdAt | timestamp | server-set |

**`requests`**
| field | type | notes |
|---|---|---|
| orderNumber | string | short human-readable code (e.g. `HM-260723-4821`), shared by every piece in the same checkout — easier to reference over the phone/WhatsApp than a raw doc ID |
| cartId | string \| undefined | set when this piece was submitted as part of a multi-item cart checkout; all pieces from that checkout share the same `cartId` (each piece is still its own doc) |
| cartSize | number \| undefined | how many pieces were in that cart checkout, alongside `cartId` |
| clientName | string | |
| clientPhone | string | |
| clientAddress | string | optional; governorate/city/street in Egypt |
| clientLocationUrl | string \| null | optional Google Maps link (`?q=lat,lng`) from the client's own device via the "Share my location" button — no typing needed |
| recipientName / recipientPhone / recipientAddress | string \| null | optional — set only when the client checked "Ship this to someone else" for this specific piece; overrides where *this piece* ships to without changing who placed the order (`clientName`/`clientPhone`/`clientAddress` stay the account holder's own info) |
| material | string | one of the fixed material keys (`silk`, `chiffon`, `satin`, `lace`, `cotton`, `crepe`, `tulle`, `organza`, `velvet`, `brocade`, `unspecified`) chosen from a dropdown — no free typing |
| productId / productName / productCode | string | which piece they're asking about; `null` when `requestType` is `custom_design` |
| requestType | string \| undefined | set to `custom_design` when the client described their own design idea instead of picking a catalog piece |
| designDescription | string \| undefined | the client's own description of the design they want, when `requestType` is `custom_design` |
| referenceImageUrl | string \| null \| undefined | optional link to a reference photo (Instagram/Pinterest/etc.) the client pasted in, when `requestType` is `custom_design` |
| orderType | string \| undefined | set to `ready_stock` when this request came from ordering an in-stock item (vs. a custom design request) |
| selectedSize / selectedColor | string \| null | the variant the client picked, when `orderType` is `ready_stock` |
| quantity | number | how many they want, when `orderType` is `ready_stock` |
| preferredDate | string | optional |
| notes | string | |
| status | string | `new` → `contacted` → `confirmed` → `in_progress` → `delivered` / `cancelled` |
| finalAmount | number \| null \| undefined | the actual price staff typed in (in EGP) once the order is delivered — feeds the Dashboard's average-amount-collected stat. For a multi-item order, every sibling doc sharing a `cartId` carries the same value (one combined total for the whole order, not per piece) |
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
