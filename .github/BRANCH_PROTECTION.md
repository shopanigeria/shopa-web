# Branch Protection Rules

## Branch Strategy

```
main
  └── develop
        ├── feature/your-feature-name
        └── fix/your-fix-name
```

## Rules

### `main` — Production branch
- **Never commit directly to main**
- All changes must come through a pull request from `develop`
- Require at least **1 PR review** before merging
- Require CI to pass (lint, type-check, test, build) before merging
- Auto-deploy to all 4 Vercel projects on merge

### `develop` — Integration branch
- Default target for all feature and fix branches
- Merges into `main` when a release is ready
- CI runs on every push

### `feature/*` — New features
- Branch off `develop`
- Example: `feature/vendor-dashboard`, `feature/push-notifications`
- Merge back into `develop` via PR

### `fix/*` — Bug fixes
- Branch off `develop` (or `main` for hotfixes)
- Example: `fix/login-redirect`, `fix/cart-total`
- Merge back into `develop` via PR

## Setting Up Branch Protection on GitHub

1. Go to **Settings → Branches** in the GitHub repo
2. Click **Add rule** for `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (set to 1)
   - ✅ Require status checks to pass before merging
     - Add: `Lint & Type Check`, `Test`, `Build`
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings

## GitHub Secrets Required

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase VAPID key for push |
| `VERCEL_TOKEN` | Vercel API token (from vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_CUSTOMER_PROJECT_ID` | Vercel project ID for customer app |
| `VERCEL_VENDOR_PROJECT_ID` | Vercel project ID for vendor app |
| `VERCEL_UADMIN_PROJECT_ID` | Vercel project ID for university admin app |
| `VERCEL_SADMIN_PROJECT_ID` | Vercel project ID for super admin app |
