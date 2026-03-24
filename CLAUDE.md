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

| Token | Value |
|---|---|
| Primary green | `#2E7D32` |
| Dark green | `#1d5620` |
| Light green | `#40a645` |
| Secondary yellow | `#FDC500` |
| Neutral black | `#151515` |
| Neutral gray | `#9b9b9b` |
| Input background | `#eaeaea` |
| White | `#FFFFFF` |

**Fonts**
- Headings: `Satoshi, sans-serif` weight 700
- Body: `Plus Jakarta Sans, sans-serif` weight 400/500/600

**UI rules**
- Border radius on inputs/buttons/cards: `8px`
- All screens are mobile-first, max-width `390px` centered on desktop with `mx-auto`
- Bottom navigation bar is always visible on customer screens
- Green primary button: full width, `#2E7D32`, white text, `font-semibold`
- Yellow accent for links and highlights: `#FDC500`
- Input fields: `bg-[#eaeaea]`, `rounded-[8px]`, `px-[10px] py-[14px]`

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
