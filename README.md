# Patience Wholesale Collective

# Patience Sewing — B2B Wholesale Fashion Platform (Phase 1)

## Brand identity
Brand name: Patience Sewing
Primary color: #8B6F47 (Warm Cognac Brown)
Accent color: #C9A96E (Champagne Gold)
Background: #F5F0E8 (Cream)
Text: #1A1410 (Deep Espresso)
Typography: Use "Cormorant Garamond" (serif) for headings via Google Fonts, Inter for body text.
Aesthetic: Luxury artisanal African fashion brand. Minimalist, editorial, premium. Every page should feel like a high-end fashion house — no cluttered layouts, no stock-photo vibes.

## Tech stack
- React + TypeScript + Tailwind CSS + Shadcn UI
- Supabase (auth, database, storage, edge functions)
- Paystack for payments (NGN, Nigeria)
- Cloudflare Pages for hosting

## User roles (implement all three in Phase 1)
1. Guest — can browse catalog, view products, submit retailer application. Cannot see prices or add to cart.
2. Verified Retailer — can see wholesale prices, add to cart, place orders, view their dashboard.
3. Admin — full product, order, and retailer management.

Role is stored in profiles.role (enum: 'guest' | 'retailer' | 'admin').
Retailer status is stored in profiles.retailer_status (enum: 'pending' | 'approved' | 'rejected').
A user only becomes a Verified Retailer when an admin sets retailer_status = 'approved'.

---

## Database schema (implement exactly as specified)

### Table: profiles
Extends Supabase auth.users. Created automatically on signup via trigger.
- id: uuid PRIMARY KEY references auth.users(id)
- full_name: text NOT NULL
- business_name: text
- phone: text
- email: text NOT NULL
- role: text NOT NULL DEFAULT 'guest'
- retailer_status: text DEFAULT NULL
- monthly_volume: text
- business_address: text
- social_links: jsonb
- created_at: timestamptz DEFAULT now()

### Table: products
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- name: text NOT NULL
- description: text
- category: text NOT NULL
- fabric: text
- images: text[] (array of Supabase Storage URLs)
- colors: text[]
- sizes: text[]
- moq: integer NOT NULL DEFAULT 12 (minimum order quantity)
- is_active: boolean DEFAULT true
- created_at: timestamptz DEFAULT now()

### Table: pricing_tiers
One product can have multiple tiers (e.g. 12–23 pcs = ₦8,000).
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- product_id: uuid REFERENCES products(id) ON DELETE CASCADE
- min_qty: integer NOT NULL
- max_qty: integer (nullable = no upper limit)
- unit_price_ngn: numeric(10,2) NOT NULL

### Table: orders
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- retailer_id: uuid REFERENCES profiles(id)
- status: text NOT NULL DEFAULT 'pending'
  -- allowed values: 'pending' | 'payment_confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
- total_ngn: numeric(12,2) NOT NULL
- paystack_reference: text UNIQUE
- paystack_status: text
- shipping_address: text
- notes: text
- created_at: timestamptz DEFAULT now()

### Table: order_items
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- order_id: uuid REFERENCES orders(id) ON DELETE CASCADE
- product_id: uuid REFERENCES products(id)
- product_name: text NOT NULL (snapshot at time of order)
- color: text
- size: text
- quantity: integer NOT NULL
- unit_price_ngn: numeric(10,2) NOT NULL
- subtotal_ngn: numeric(10,2) NOT NULL

### Table: retailer_applications
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: uuid REFERENCES profiles(id)
- business_name: text NOT NULL
- owner_name: text NOT NULL
- phone: text NOT NULL
- email: text NOT NULL
- business_address: text NOT NULL
- monthly_volume: text
- social_links: jsonb
- status: text DEFAULT 'pending'
- admin_notes: text
- submitted_at: timestamptz DEFAULT now()

### Row Level Security (enable on all tables)
- profiles: users can read/update their own row. Admins can read all.
- products: anyone can read active products. Only admins can insert/update/delete.
- pricing_tiers: readable by verified retailers and admins only.
- orders: retailers see only their own orders. Admins see all.
- order_items: same as orders.
- retailer_applications: users see their own. Admins see all.

---

## Seed data (insert on first deploy)

### 3 sample products with pricing tiers:

Product 1:
- name: "Ankara Wrap Dress"
- category: "Dresses"
- fabric: "100% Ankara cotton"
- colors: ["Royal Blue", "Burnt Orange", "Forest Green"]
- sizes: ["S", "M", "L", "XL", "XXL"]
- moq: 12
- Tiers: 12–23 pcs = ₦8,500 | 24–59 pcs = ₦7,800 | 60+ pcs = ₦7,000

Product 2:
- name: "Lace Overlay Blouse"
- category: "Tops"
- fabric: "French lace + silk lining"
- colors: ["Ivory", "Champagne", "Black"]
- sizes: ["S", "M", "L", "XL"]
- moq: 24
- Tiers: 24–47 pcs = ₦5,200 | 48–99 pcs = ₦4,700 | 100+ pcs = ₦4,200

Product 3:
- name: "Adire Midi Skirt"
- category: "Skirts"
- fabric: "Hand-dyed Adire cotton"
- colors: ["Indigo", "Terracotta", "Natural"]
- sizes: ["S", "M", "L", "XL", "XXL"]
- moq: 12
- Tiers: 12–23 pcs = ₦6,000 | 24–59 pcs = ₦5,500 | 60+ pcs = ₦4,800

---

## Pages to build (Phase 1)

### 1. Homepage
- Full-width hero: large editorial image area (use a warm brown/cream placeholder), headline "Premium African Fashion, Wholesale." subheadline "Minimum 12 pieces. Maximum quality.", two CTAs: "Browse Collection" and "Apply as Retailer"
- Featured collections strip (3 product cards)
- "Why Patience Sewing" section: 3 columns — Quality Fabrics / Fast Production / Trusted by 500+ Retailers
- Become a Retailer CTA banner (cognac brown background, cream text)
- Footer: brand name, nav links, contact email

### 2. Catalog page (/catalog)
- Sidebar filters: Category, Color, Fabric, MOQ range
- Product grid (3 columns desktop, 2 tablet, 1 mobile)
- Each product card shows: image, name, category, "From ₦X,XXX / piece", MOQ badge (e.g. "Min. 12 pcs")
- IMPORTANT: If user is a guest, show price as "Login to see pricing" — blurred/locked state
- If user is a retailer, show real tiered pricing

### 3. Product detail page (/catalog/:id)
- Image gallery (main + thumbnails)
- Product name, fabric, description
- Color selector (pill buttons)
- Size selector (pill buttons)
- Pricing tiers table — visible to retailers only (locked for guests with "Apply for wholesale access" CTA)
- Quantity input with MOQ enforcement: show error if quantity < moq
- "Add to Cart" button (retailers only) and "Request Quotation" button (all users)
- Tiered pricing auto-calculates: as user types quantity, show the applicable tier price and subtotal in real time

### 4. Cart page (/cart)
- List of cart items with image, name, color, size, quantity, unit price, subtotal
- MOQ validation on each item (highlight in red if any item is below MOQ)
- Order summary: subtotal, note about shipping ("Shipping calculated at checkout")
- "Proceed to Checkout" button — disabled if any MOQ violations

### 5. Checkout page (/checkout)
- Shipping address form (full name, phone, address line 1, address line 2, state, city)
- Order summary sidebar
- "Pay with Paystack" button
- On click: call Paystack inline JS popup with the exact amount in NGN (kobo = amount × 100), retailer email, and a generated reference string (PSW-{timestamp}-{userId-last4})
- On Paystack success callback: call a Supabase Edge Function /functions/v1/verify-paystack-payment
- Edge function verifies with Paystack API using secret key, then sets order.paystack_status = 'verified' and order.status = 'payment_confirmed'
- Redirect to /order-confirmation/:orderId

### 6. Order confirmation page (/order-confirmation/:id)
- Success message with order ID
- Summary of what was ordered
- "View my orders" button

### 7. Retailer application page (/apply)
- Form fields: Business name, Owner full name, Phone, Email, Business address, Monthly purchase volume (dropdown: Under ₦500k / ₦500k–₦2M / ₦2M–₦10M / Above ₦10M), Instagram handle (optional), WhatsApp number
- On submit: insert into retailer_applications table, show confirmation message "Application received. We review within 48 hours."
- If user is already logged in, pre-fill email and name

### 8. Auth pages
- /login — email + password, link to /apply
- /signup — full name, email, password, confirm password
- On signup: create profile row automatically via Supabase trigger
- /forgot-password — email reset

### 9. Retailer dashboard (/dashboard)
Only accessible to verified retailers (retailer_status = 'approved'). Redirect guests and pending applicants to /apply.
- Overview tab: total orders, total spend (NGN), last order date
- Orders tab: table of all orders with status badge, date, total, "View" link
- Order detail modal: shows all items, status, Paystack reference
- Account tab: edit full name, phone, business address

### 10. Admin dashboard (/admin)
Only accessible to users with role = 'admin'. Redirect all others to homepage.
- Products tab: table of all products, "Add product" button (form), "Edit" and "Delete" per row
  - Add/Edit product form: name, category, fabric, colors (comma-separated), sizes (comma-separated), MOQ, description, image upload (to Supabase Storage), pricing tiers (add/remove rows with min qty, max qty, unit price)
- Orders tab: table of all orders, filter by status, click to update status (dropdown)
- Retailers tab: table of all retailer_applications, status badge, "Approve" and "Reject" buttons
  - On Approve: set retailer_applications.status = 'approved' AND profiles.role = 'retailer' AND profiles.retailer_status = 'approved'
  - On Reject: set retailer_applications.status = 'rejected' AND profiles.retailer_status = 'rejected'

---

## Paystack integration (exact implementation)

Use Paystack Inline JS (not redirect). Load this in index.html:


Payment handler function:
```js
function initPaystackPayment(order) {
  const handler = PaystackPop.setup({
    key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    email: user.email,
    amount: Math.round(order.total_ngn * 100), // convert to kobo
    currency: 'NGN',
    ref: `PSW-${Date.now()}-${user.id.slice(-4)}`,
    metadata: { order_id: order.id, retailer_id: user.id },
    onClose: () => { showToast('Payment cancelled'); },
    callback: async (response) => {
      // response.reference is the Paystack transaction reference
      await supabase.functions.invoke('verify-paystack-payment', {
        body: { reference: response.reference, order_id: order.id }
      });
      navigate(`/order-confirmation/${order.id}`);
    }
  });
  handler.openIframe();
}
```

Supabase Edge Function (create at /supabase/functions/verify-paystack-payment/index.ts):
- Receives: { reference: string, order_id: string }
- Calls: GET https://api.paystack.co/transaction/verify/{reference} with Authorization: Bearer {PAYSTACK_SECRET_KEY}
- If response.data.status === 'success': update orders set paystack_status='verified', status='payment_confirmed' where id=order_id
- If not: update orders set paystack_status='failed'
- Return: { success: boolean, status: string }

Environment variables needed:
- VITE_PAYSTACK_PUBLIC_KEY (frontend)
- PAYSTACK_SECRET_KEY (edge function only, never expose to frontend)

---

## Design rules (enforce throughout)
- Use "Cormorant Garamond" font for all H1, H2, H3 headings. Import from Google Fonts.
- Brand color (#8B6F47) for all primary buttons, active states, and accent borders.
- Champagne gold (#C9A96E) for hover states, price highlights, and CTA banners.
- Cream (#F5F0E8) for page backgrounds and cards.
- No rounded pill buttons — use border-radius: 2px for a sharp, tailored feel.
- Product cards: no drop shadows. Use a 1px solid #E8E0D4 border instead.
- Spacing: generous. 80px section padding. 32px card padding.
- Mobile-first. All pages must be fully usable on a 375px screen.
- Loading states on every async action (Supabase queries, Paystack init).
- Toast notifications for: cart add, form submission, errors, payment status.
  

Paystack payment flow

1

Retailer clicks "Pay with Paystack" on /checkoutFrontend creates an order row in Supabase with status = 'pending' before opening Paystack

2

Paystack Inline popup opens in-browserAmount in kobo (total × 100), email, generated reference PSW-{timestamp}-{uid}

3

Customer completes card / bank transfer in popupPaystack handles PCI compliance — no card data touches your server

4

Paystack fires callback with transaction referenceNever trust this alone — must verify server-side

5

Frontend calls Supabase Edge Function verify-paystack-paymentPasses reference + order_id. Edge function holds the secret key.

6

Edge function calls Paystack /transaction/verify APIChecks status === 'success' and amount matches order total

7

Order updated to payment_confirmed in SupabaseRetailer redirected to /order-confirmation/:id

Environment variables checklist

VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxx        # frontend only

# Supabase Edge Function secrets (set via Supabase dashboard)
PAYSTACK_SECRET_KEY=sk_live_xxxx             # never in frontend

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://patiencesewing.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/59afb93d-e2f3-44a0-924d-eb434ce89110).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
