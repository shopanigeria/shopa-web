export const ROUTES = {
  // Public
  HOME_PAGE: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Customer
  HOME: "/home",
  CATEGORIES: "/categories",
  PRODUCTS: "/products",
  PRODUCT: (id: string) => `/products/${id}`,
  CART: "/cart",
  CHECKOUT: "/checkout",
  CHECKOUT_SUCCESS: "/checkout/success",
  ORDERS: "/orders",
  ORDER: (id: string) => `/orders/${id}`,
  PROFILE: "/profile",
  ACCOUNT_SETTINGS: "/account-settings",
  SAVED: "/saved",
  VOUCHERS: "/vouchers",
  REFERRALS: "/referrals",
  HELP: "/help",
  TERMS: "/terms",
  DISPUTES_NEW: "/disputes/new",

  // Vendor
  VENDOR_DASHBOARD: "/vendor/dashboard",
  VENDOR_PRODUCTS: "/vendor/products",
  VENDOR_ORDERS: "/vendor/orders",
  VENDOR_SETTINGS: "/vendor/settings",

  // Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_VENDORS: "/admin/vendors",
  ADMIN_ORDERS: "/admin/orders",
  ADMIN_DISPUTES: "/admin/disputes",

  // Super Admin
  SUPERADMIN_DASHBOARD: "/superadmin/dashboard",
} as const;

export const QUERY_KEYS = {
  USER: ["user"],
  PRODUCTS: ["products"],
  PRODUCT: (id: string) => ["products", id],
  CATEGORIES: ["categories"],
  ORDERS: ["orders"],
  ORDER: (id: string) => ["orders", id],
  CART: ["cart"],
  SAVED_ITEMS: ["saved-items"],
  VOUCHERS: ["vouchers"],
  REVIEWS: (productId: string) => ["reviews", productId],
} as const;

export const SERVICE_FEE_RATE = 0.075;
export const ITEMS_PER_PAGE = 20;
