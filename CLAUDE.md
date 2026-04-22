# Shopa Web — Claude Code Context

You are the technical co-founder helping build Shopa, a student-focused e-commerce web app for Nigerian university campuses. The MVP is targeting Crawford University students.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS (no external UI libraries)
- **Server state**: TanStack Query (`useQuery`, `useMutation`, `useInfiniteQuery`)
- **Client state**: Zustand (`src/stores/auth.store.ts`, `src/stores/cart.store.ts`)
- **API client**: Axios instance at `src/lib/api/client.ts` (auto-attaches JWT, handles token refresh)
- **Forms**: React Hook Form + Zod validation
- **Toasts**: Sonner (`import { toast } from "sonner"`)

---

## Design Tokens (strictly follow these always)

### Colors

| Token name | Tailwind value | Hex |
|---|---|---|
| Primary green | `bg-[#2E7D32]` | `#2E7D32` |
| Dark green (Primary 5) | `bg-[#1D5620]` | `#1D5620` |
| Light green (Primary 2) | `bg-[#40A645]` | `#40A645` |
| Mint green (Primary 3) | `bg-[#52D159]` | `#52D159` |
| Pale green (Primary 4) — chip/badge bg | `bg-[#D8FFDA]` | `#D8FFDA` |
| Deepest green (Primary 7) | `bg-[#031504]` | `#031504` |
| Secondary yellow | `bg-[#FDC500]` | `#FDC500` |
| Customer screen background | `bg-[#F7FFF8]` | `#F7FFF8` |
| Neutral black (Black 7) | `text-[#151515]` | `#151515` |
| Neutral dark (Black) | `text-[#333333]` | `#333333` |
| Neutral dark-2 (Black 2) | `text-[#545454]` | `#545454` |
| Neutral mid (Black 3) | `text-[#767676]` | `#767676` |
| Neutral gray (Black 4) | `text-[#9B9B9B]` | `#9B9B9B` |
| Neutral light (Black 5) — placeholder text | `text-[#C2C2C2]` | `#C2C2C2` |
| Input background (Black 6) | `bg-[#EAEAEA]` | `#EAEAEA` |
| Secondary text | `text-[#666666]` | `#666666` |
| White | `bg-white` | `#FFFFFF` |

### Fonts
- Headings: `Satoshi, sans-serif` weight 700
- Body: `Plus Jakarta Sans, sans-serif` weight 400/500/600

### UI rules
- Border radius on inputs/buttons/cards: `8px`
- All screens are mobile-first, max-width `390px` centered on desktop with `mx-auto`
- All customer screens have background `#F7FFF8` (not pure white)
- Bottom navigation bar is always visible on customer screens
- Green primary button: full width, `#2E7D32`, white text, `font-semibold`
- Yellow accent for links and highlights: `#FDC500`
- Input fields: `bg-[#eaeaea]`, `rounded-[8px]`, `px-[10px] py-[14px]`
- Category chips: `bg-[#D8FFDA]`, `rounded-[5px]`, `h-[30px]`, `px-[10px]`, Primary green icon + label
- Green header bar: `bg-[#2E7D32]`, `rounded-b-[12px]`, `h-[155px]`, full 390px width

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # login, signup, forgot-password, reset-password
│   ├── (customer)/       # all customer screens
│   ├── (vendor)/         # vendor dashboard
│   ├── (admin)/          # admin dashboard
│   └── auth/google/callback/
├── components/
│   ├── ui/               # base components (Button, Input, etc.)
│   ├── layout/           # Navbar, BottomNav, Sidebar
│   ├── shared/           # shared across roles
│   └── customer/         # customer-specific components
├── hooks/                # useAuth, useProducts, useOrders, etc.
├── lib/
│   ├── api/
│   │   ├── client.ts     # Axios instance
│   │   ├── index.ts      # exports
│   │   └── services/     # auth, products, orders, etc.
│   ├── constants/        # ROUTES, QUERY_KEYS
│   ├── utils/            # cn(), formatNaira(), etc.
│   └── validators/       # Zod schemas
├── stores/               # auth.store.ts, cart.store.ts
└── types/                # index.ts — all TypeScript types
```

---

## API Base URL

```
process.env.NEXT_PUBLIC_API_URL  (set to https://shopa-api-sxfc.onrender.com/api/v1)
```

All API calls go through `apiClient` from `src/lib/api/client.ts`. Never use fetch directly.

---

## Full API Endpoint Reference

### Auth — `/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email + password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout current session |
| POST | `/auth/logout-all` | Logout all sessions |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |

### Users — `/users`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update profile (firstName, lastName, phone) |
| POST | `/users/upload-student-id` | Upload student ID for verification |
| GET | `/users/pending-verifications` | List pending verifications (admin) |
| PATCH | `/users/:id/verify` | Verify/reject a user (admin) |

### Vendors — `/vendors`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/vendors` | List all verified vendors |
| GET | `/vendors/me` | Get current vendor profile |
| GET | `/vendors/:id` | Get vendor by ID |
| POST | `/vendors/apply` | Apply to become a vendor |
| PATCH | `/vendors/me` | Update vendor profile |
| GET | `/vendors/pending` | List pending vendor applications (admin) |
| PATCH | `/vendors/:id/verify` | Verify/reject vendor (admin) |

### Products — `/products`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | List all products (supports ?categoryId, ?search, ?page, ?limit, ?campusId) |
| GET | `/products/me` | Get current vendor's products |
| GET | `/products/:id` | Get product by ID |
| POST | `/products` | Create product (vendor only) |
| PATCH | `/products/:id` | Update product (vendor only) |
| DELETE | `/products/:id` | Delete product (vendor only) |

### Categories — `/categories`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories` | List all categories |
| GET | `/categories/:id` | Get category by ID |
| POST | `/categories` | Create category (admin only) |
| PATCH | `/categories/:id` | Update category (admin only) |
| DELETE | `/categories/:id` | Delete category (admin only) |

### Orders — `/orders`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders/my-orders` | Get current user's orders |
| GET | `/orders/vendor-orders` | Get vendor's received orders |
| GET | `/orders/:id` | Get order by ID |
| POST | `/orders` | Create new order |
| PATCH | `/orders/:id/status` | Update order status (vendor) |
| POST | `/orders/:id/confirm-delivery` | Confirm delivery (buyer) |

### Payments — `/payments`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/initialize` | Initialize Paystack payment |
| POST | `/payments/webhook/paystack` | Paystack webhook (backend only) |
| GET | `/payments/verify/:reference` | Verify payment by reference |
| GET | `/payments/:orderId` | Get payment for order |
| POST | `/payments/:orderId/release` | Release escrow to vendor |
| POST | `/payments/:orderId/refund` | Refund payment to buyer |

### Disputes — `/disputes`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/disputes/my-disputes` | Get current user's disputes |
| GET | `/disputes` | List all disputes (admin) |
| GET | `/disputes/:id` | Get dispute by ID |
| POST | `/disputes` | Raise a dispute |
| PATCH | `/disputes/:id/resolve` | Resolve dispute (admin) |

### Reviews — `/reviews`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/reviews/product/:productId` | Get reviews for a product |
| GET | `/reviews/vendor/:vendorId` | Get reviews for a vendor |
| POST | `/reviews` | Create a review |
| PATCH | `/reviews/:id` | Update a review |
| DELETE | `/reviews/:id` | Delete a review |

### Campus — `/campuses`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/campuses` | List all campuses |
| GET | `/campuses/:id` | Get campus by ID |

### Notifications — `/notifications`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | Get current user's notifications |
| GET | `/notifications/unread-count` | Get unread notification count |
| PATCH | `/notifications/:id/read` | Mark notification as read |
| POST | `/notifications/mark-all-read` | Mark all as read |

### Messaging — `/messaging`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/messaging/conversations` | List user's conversations |
| POST | `/messaging/conversations` | Start a new conversation |
| GET | `/messaging/conversations/:id` | Get conversation by ID |
| GET | `/messaging/conversations/:id/messages` | Get messages in conversation |
| POST | `/messaging/conversations/:id/messages` | Send a message |
| POST | `/messaging/conversations/:id/read` | Mark messages as read |

### Upload — `/upload`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload/image` | Upload single image to Cloudinary |
| POST | `/upload/images` | Upload multiple images |

### Analytics — `/analytics`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/vendor` | Vendor analytics (vendor only) |
| GET | `/analytics/admin` | Platform analytics (admin only) |

---

## Key Business Logic

- **Service fee**: 7.5% on subtotal (already in `src/lib/utils/index.ts` as `calculateServiceFee()`)
- **Currency**: Nigerian Naira — use `formatNaira()` from `src/lib/utils/index.ts`
- **Roles**: `STUDENT`, `VENDOR`, `ADMIN` (from Prisma enum — note: STUDENT = customer)
- **Campus**: Crawford University is the only active campus for MVP
- **Payment flow**: Create order → Initialize payment → Paystack redirect → Verify payment
- **Auth flow**: JWT access token (15min) + refresh token (7 days), stored in cookies

---

## Existing Utilities (use these, don't recreate)

```typescript
import { cn } from "@/lib/utils"                    // merge Tailwind classes
import { formatNaira } from "@/lib/utils"            // format NGN currency
import { calculateServiceFee } from "@/lib/utils"    // 7.5% fee
import { calculatePaystackFee } from "@/lib/utils"   // Paystack fee
import { ROUTES } from "@/lib/constants"             // all app routes
import { QUERY_KEYS } from "@/lib/constants"         // TanStack Query keys
import { useAuth } from "@/hooks/useAuth"            // auth hook
import { useCartStore } from "@/stores/cart.store"   // cart state
```

---

## Coding Rules (always follow)

1. **Read first** — always read existing files before creating or editing
2. **Reuse** — check `src/components/` and `src/hooks/` before creating new ones
3. **Real API only** — never use mock/placeholder data, always wire to real endpoints
4. **Loading + error states** — every data fetch needs loading skeleton and error handling
5. **Mobile-first** — design for 390px width first, then scale up
6. **"use client"** — add to any component using hooks, state, or browser APIs
7. **Thin pages** — pages should mostly compose components, not contain raw UI
8. **Type safety** — use types from `src/types/index.ts`, never use `any`
9. **Toast feedback** — use `toast.success()` / `toast.error()` for user actions
10. **No hardcoded text** — use constants where possible
11. **Read before writing** — always read the existing file at the target path before making any changes. If the file already exists, update it rather than rewriting from scratch. Preserve existing logic, API wiring, and state management — only update what the Figma design requires.

---

## Typography Scale

All named text styles from Figma. Use these via Tailwind classes — do not invent new type styles.

| Style name | Font | Weight | Size | Line height | Letter spacing | Usage |
|---|---|---|---|---|---|---|
| `H2 Mobile` | Satoshi | 700 | 20px | 1.35em | — | Page titles, major headings |
| `H3 Mobile` | Plus Jakarta Sans | 600 | 18px | 1.26em | -4% | Section headings, screen titles |
| `style_5JUGR7` | Plus Jakarta Sans | 500 | 18px | 1.26em | -4% | Sub-headings (medium weight) |
| `Body Mobile` | Plus Jakarta Sans | 500 | 14px | 2em | -4% | Body text, order IDs, descriptions |
| `Buttons Mobile` | Plus Jakarta Sans | 600 | 14px | 1.26em | — | Buttons, CTAs |
| `style_HB66J6` | Plus Jakarta Sans | 600 | 14px | 2em | -4% | Bold body labels |
| `style_IREANF` | Plus Jakarta Sans | 500 | 14px | 1.26em | -4% | Medium body text |
| `style_RY5B59` | Plus Jakarta Sans | 700 | 14px | 1.26em | -4% | Bold 14px (prices, totals) |
| `style_QVAN8Z` | SF Pro | 590 | 17px | 1.29em | — | System status bar (time display only) |
| `Captions Mobile` | Plus Jakarta Sans | 400 | 12px | 1.26em | -4% | Labels, badges, secondary text, nav labels |
| `style_G7JAOG` | Plus Jakarta Sans | 600 | 12px | 1.26em | -4% | Bold captions |
| `style_5MIOS3` | Plus Jakarta Sans | 700 | 12px | 1.26em | -4% | Bold 12px (price totals, section headers) |
| `style_A7K9CY` | Plus Jakarta Sans | 600 | 12px | 1.26em | — | Medium bold captions |
| `style_KVLBO0` | Plus Jakarta Sans | 400 | 12px | 1.67em | -4% | Loose captions, help text |
| `style_3L6PUU` | Plus Jakarta Sans | 400 | 12px | 1.26em | -4% | Regular 12px |
| `style_6BD5QD` | Plus Jakarta Sans | 700 | 12px | 1.67em | -4% | Bold loose captions |
| `style_MC6CF2` | Satoshi | 500 | 12px | 1.35em | -4% | Category chip labels |
| `Caption2/Regular` | SF Pro | 400 | 11px | 1.18em | +0.55% | Smallest system captions |

**Tailwind equivalents:**
- H2 Mobile → `font-satoshi text-[20px] font-bold leading-[1.35]`
- H3 Mobile → `font-jakarta text-[18px] font-semibold leading-[1.26] tracking-[-0.04em]`
- Body Mobile → `font-jakarta text-[14px] font-medium leading-[2] tracking-[-0.04em]`
- Buttons Mobile → `font-jakarta text-[14px] font-semibold leading-[1.26]`
- Captions Mobile → `font-jakarta text-[12px] font-normal leading-[1.26] tracking-[-0.04em]`

---

## Customer Screen Inventory

All screens in `src/app/(customer)/`. Device canvas is 390×844px.

| Screen name | File path | Figma node ID | Notes |
|---|---|---|---|
| Splash Screen | `src/app/(customer)/page.tsx` or `/` root | `253:7113` | Logo + "Buy. Sell. Connect." + swipe-up prompt |
| Homepage | `src/app/(customer)/home/page.tsx` | `379:9089` | Green header, category chips, product grid sections |
| Individual Category | `src/app/(customer)/categories/[id]/page.tsx` | `484:8925` | Category product list with SORT BY |
| Individual Category (search active) | `src/app/(customer)/categories/[id]/page.tsx` | `498:9290` | Same route, search/sort-by sheet open |
| Product Page (book) | `src/app/(customer)/products/[id]/page.tsx` | `406:9932` | Details tab + Reviews tab, no size selector |
| Product Page (clothing) | `src/app/(customer)/products/[id]/page.tsx` | `518:10322` | Details + Reviews tabs, with size selector (XS/S/M/L/XL) |
| Reviews Page | `src/app/(customer)/products/[id]/reviews/page.tsx` | `504:9928` | Full reviews list |
| Categories (overview) | `src/app/(customer)/categories/page.tsx` | `943:10866` | All top-level categories listed |
| Cart | `src/app/(customer)/cart/page.tsx` | `518:10096` | Cart items + subtotal + Continue to Checkout CTA |
| Saved Items | `src/app/(customer)/profile/saved/page.tsx` | `948:9702` | Saved product cards with "Add to cart" |
| Saved Items (empty) | `src/app/(customer)/profile/saved/page.tsx` | `948:9896` | Empty state illustration |
| Vouchers | `src/app/(customer)/profile/vouchers/page.tsx` | `1066:12781` | Empty vouchers state |
| Referrals | `src/app/(customer)/profile/referrals/page.tsx` | `1066:12852` | Copy referral link CTA |
| Help & Support | `src/app/(customer)/profile/help/page.tsx` | `1066:13154` | Help options list |
| Terms & Policies | `src/app/(customer)/profile/terms/page.tsx` | `1066:13433` | Terms text |
| Raise Order Dispute | `src/app/(customer)/profile/disputes/new/page.tsx` | `948:10272` (section) | Multi-state: form / invalid ID / file upload / success |
| Profile | `src/app/(customer)/profile/page.tsx` | `604:9269` | Greeting + settings menu list + Sign Out |
| Order History | `src/app/(customer)/profile/orders/page.tsx` | `604:10275` (section) | Order list, sort/filter, order detail view |
| Checkout (pickup) | `src/app/(customer)/checkout/page.tsx` | `522:10516` | Pickup + Transfer payment + price summary |
| Checkout (delivery — input) | `src/app/(customer)/checkout/page.tsx` | `604:9668` | Delivery + address input field |
| Checkout (delivery — saved) | `src/app/(customer)/checkout/page.tsx` | `604:9154` | Delivery + saved address + change option |
| Checkout (success) | `src/app/(customer)/checkout/success/page.tsx` | `604:9053` | Order confirmation success screen |
| Account Settings | `src/app/(customer)/profile/settings/page.tsx` | `604:10059` (section) | Edit name/phone/email, Change PIN flow |

---

## Reusable Components

All in `src/components/`. Build these once; pages compose them.

### `src/components/layout/GreenHeader.tsx`
- Full-width green bar (`#2E7D32`), 155px tall, `rounded-b-[12px]`
- Contains: logo/branding top-left, search bar at bottom
- **Search bar inside**: white bg, `rounded-[12px]`, 342px wide, 45px tall, `gap-[10px]`, `p-[10px]`; `search-lg` icon (24×24) + placeholder in `#C2C2C2` (Captions Mobile)
- Appears on: Homepage, Individual Category screens

### `src/components/layout/BottomNav.tsx`
- 4 tabs: **Home** (`home-02` icon), **Categories** (grid icon), **Cart** (shopping bag icon), **Profile** (`user-02` icon)
- Container: 342px wide, 55px tall, `rounded-[48px]`, `bg-[rgba(255,255,255,0.75)]`, `shadow-[0px_0px_1px_0px_rgba(0,0,0,0.3)]`, positioned absolute at `left-[24px] bottom-[17px]`
- Active tab: icon + label in `#2E7D32` (Primary), wrapped in `rounded-[48px]` bg `rgba(51,51,51,0.1)`, 72×47px
- Inactive tab: icon + label in `#151515` (Neutral Black 7), 65px wide
- Label style: Captions Mobile (Plus Jakarta Sans 400 12px)
- Visible on all customer screens except Splash and Onboarding

### `src/components/customer/ProductCard.tsx`
- Outer card: 170px wide, variable height, `rounded-[12px]`, border `rgba(255,255,255,0.1)`
- Inner wrapper: `rounded-[8px]`, `p-[10px]`, column layout, `gap-[10px]`
- Product image: fill-width, 137px tall, `rounded-[6px]`, `object-cover`
- Product name: Captions Mobile (`#545454`)
- Price: `#25,000` format (₦ sign), Captions Mobile, `#151515` — 54px wide price container
- Rating row: star icons (16×16) + review count `(6)` in Captions Mobile `#545454`
- "Add to cart" button: `bg-[#2E7D32]`, `rounded-[8px]`, `py-[8px] px-[10px]`, full-width, Buttons Mobile white text
- Wishlist icon: top-right absolute, `rounded-full`, `bg-[#D8FFDA]`, 24×24px

### `src/components/customer/CategoryChip.tsx`
- Row layout, `bg-[#D8FFDA]`, `rounded-[5px]`, `h-[30px]`, `px-[10px]`, `gap-[10px]`
- 14×14px category icon stroked in `#2E7D32`
- Label: Satoshi 500 12px, `#2E7D32`
- Scrollable horizontally on Homepage (overflow-x scroll, `gap-[10px]`)

### `src/components/customer/SectionHeader.tsx`
- Row, `justify-between`, `items-center`
- Title: H3 Mobile (Plus Jakarta Sans 600 18px), `#151515`
- "See all" link: Captions Mobile (Plus Jakarta Sans 400 12px), `#2E7D32`

### `src/components/customer/OrderCard.tsx`
- `bg-white`, `border border-[#EAEAEA]`, `rounded-[8px]`
- Order ID: Body Mobile (Plus Jakarta Sans 500 14px), `#333333`
- "View Order Details": Captions Mobile, `#FDC500` (Secondary yellow)
- Order detail view includes: status badge, placed date, item list, delivery details, subtotal/service fee/total breakdown, optional "Raise Order Dispute" link

### `src/components/customer/SortButton.tsx`
- `switch-vertical-01` icon + "SORT BY" text
- Opens sort sheet with options: Best ratings / Popularity / Newest first / Oldest first / Price (low→high) / Price (high→low)

### `src/components/ui/PrimaryButton.tsx`
- `bg-[#2E7D32]`, `text-white`, `rounded-[8px]`, `w-full`, Buttons Mobile (Plus Jakarta Sans 600 14px)
- Padding: `py-[10px] px-[10px]`

### `src/components/customer/PriceDisplay.tsx`
- Naira sign (₦) as SVG/vector + amount text, displayed side-by-side
- Totals use `style_5MIOS3` (Plus Jakarta Sans 700 12px) or `style_RY5B59` (700 14px)

---

## Navigation Flow

```
Splash Screen (253:7113)
  └─► Onboarding / Auth flows
        ├─► Login → Home
        └─► Sign Up → Email verification → Login → Home

Home (379:9089) [Tab: Home]
  ├─► Category chip → Individual Category (484:8925)
  │     ├─► Sort/Search overlay → (498:9290)
  │     └─► Product Card tap → Product Page
  ├─► "See all" (Popular) → Individual Category listing
  └─► Product Card tap → Product Page (406:9932 or 518:10322)
        ├─► Reviews tab → Reviews Page (504:9928)
        └─► "Add to cart" → Cart (518:10096)
              └─► "Continue to Checkout" → Checkout (522:10516)
                    ├─► Pickup flow → Make Payment → Order Success (604:9053)
                    └─► Delivery flow (604:9668 / 604:9154) → Make Payment → Order Success

Categories (943:10866) [Tab: Categories]
  └─► Top-level category → Individual Category
        Sub-categories shown: Men's Fashion, Women's Fashion, Unisex Fashion,
        Gadgets & Accessories, Body care & Beauty, Provisions, Sports, Stationery, Others

Cart (518:10096) [Tab: Cart]
  └─► "Continue to Checkout" → Checkout

Profile (604:9269) [Tab: Profile]
  ├─► Account Settings → Edit profile / Change PIN (604:10059)
  ├─► Order History → Order list → Order detail (604:10275)
  ├─► Saved Items → Saved list or empty state (948:9702 / 948:9896)
  ├─► Raise Order Dispute → Dispute form (948:10272)
  ├─► Vouchers (1066:12781)
  ├─► Referrals (1066:12852)
  ├─► Help & Support (1066:13154)
  ├─► Terms & Policies (1066:13433)
  └─► SIGN OUT → Login screen
```

**Back navigation**: All inner screens use `chevron-left` icon top-left to go back.
**Modal/Sheet patterns**: Sort-by and Filter-by open as bottom sheets (not full page navigation).
**Delivery type**: Checkout has in-page toggle between Pickup and Delivery that reveals address field.
