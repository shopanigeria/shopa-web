# Shopa Web — Customer & Vendor Marketplace

Student-focused e-commerce platform for Nigerian university campuses.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **State**: Zustand + TanStack Query
- **Auth**: JWT + HttpOnly Cookies + Google OAuth
- **Backend**: NestJS (existing API)
- **Deployment**: Vercel (frontend) + Render (backend)

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/your-org/shopa-web.git
cd shopa-web

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values in .env.local

# 4. Run development server
npm run dev
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Login, Signup, Forgot Password
│   ├── (customer)/       # Customer storefront
│   ├── (vendor)/         # Vendor dashboard
│   ├── (admin)/          # Admin dashboard
│   └── (superadmin)/     # Super admin panel
├── components/
│   ├── ui/               # Base UI components (shadcn)
│   ├── layout/           # Navbar, Footer, Sidebars
│   ├── shared/           # Shared across roles
│   ├── customer/         # Customer-specific components
│   ├── vendor/           # Vendor-specific components
│   └── admin/            # Admin-specific components
├── hooks/                # Custom React hooks
├── lib/
│   ├── api/              # Axios client + service layer
│   ├── auth/             # Auth utilities
│   ├── constants/        # App constants + routes
│   ├── utils/            # Helper functions
│   └── validators/       # Zod schemas
├── stores/               # Zustand stores
├── styles/               # Global CSS
└── types/                # TypeScript types
```

## Branch Strategy

- `main` — production, auto-deploys to Vercel
- `develop` — staging, integration branch
- `feature/*` — feature branches, PR into develop
- `fix/*` — bug fix branches

## Environment Variables

See `.env.example` for all required variables.
