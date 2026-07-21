# Habiba Mousa Couture — Reservation & Inquiry Site

A two-part site:
- **`index.html`** — public gallery + "Request This Design" form (writes to Firestore, no payment)
- **`admin.html`** — staff dashboard to manage the catalog and incoming requests

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

## 3. Deploy the security rules

Copy the contents of `firestore.rules` into **Firestore → Rules** in the console, and click Publish.
This makes sure:
- Anyone can browse products and submit a request (no login needed)
- Only signed-in staff (listed in the `staff` collection) can view requests, manage products, or edit the catalog
- Only `role: admin` staff can manage other staff

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
Repeat steps 1–5 above for each new person — create their Auth login, then add a `staff` doc keyed by their UID with `role: staff` (or `admin` if they need full access). The "Add Staff Member" form in the dashboard records a request for this in a `staff_pending` list as a reminder, but the actual access grant needs the UID step above, since Firestore rules check against Auth UIDs for security.

## 5. Add your first products

Once signed in to `admin.html` → **Products** → **+ Add Piece**. Fields:
- Name, category, price range, description
- Image URL — for now, paste a hosted image link (e.g. upload to Firebase Storage and paste the URL, or any hosted image link). Direct image upload from the dashboard can be added as a next step if useful.
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
| category | string | e.g. Evening Gown, Abaya, Bridal |
| description | string | |
| priceRange | string | free text, e.g. "AED 1,800 – 2,600" |
| images | array of strings | image URLs |
| status | string | `active` or `archived` |
| createdAt | timestamp | server-set |

**`requests`**
| field | type | notes |
|---|---|---|
| clientName | string | |
| clientPhone | string | |
| productId / productName | string | which piece they're asking about |
| preferredDate | string | optional |
| notes | string | |
| status | string | `new` → `contacted` → `confirmed` → `in_progress` → `delivered` / `cancelled` |
| createdAt | timestamp | server-set |

**`staff`**
| field | type | notes |
|---|---|---|
| doc ID | — | must equal the person's Firebase Auth UID |
| name | string | |
| email | string | |
| role | string | `admin` or `staff` |

## Natural next steps (not built yet, flag if you want these)
- Direct image upload to Firebase Storage from the admin panel (right now it's a pasted URL)
- WhatsApp/email/Telegram auto-notification via a Cloud Function when a new request lands
- Multi-image galleries per piece
- Arabic-language toggle for the public site
