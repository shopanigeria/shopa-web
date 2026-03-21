// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = "customer" | "vendor" | "admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: Category;
  vendor: Pick<Vendor, "id" | "storeName" | "rating">;
  stock: number;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  createdAt: string;
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  storeName: string;
  description?: string;
  logoUrl?: string;
  rating?: number;
  isVerified: boolean;
  userId: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "disputed";

export interface OrderItem {
  id: string;
  product: Pick<Product, "id" | "name" | "imageUrls" | "price">;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  reference: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  serviceFee: number;
  paystackFee: number;
  total: number;
  deliveryAddress?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// ─── Dispute ──────────────────────────────────────────────────────────────────

export interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  status: "open" | "under_review" | "resolved" | "rejected";
  proofUrls: string[];
  accountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: string;
}

// ─── Voucher ──────────────────────────────────────────────────────────────────

export interface Voucher {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  expiresAt: string;
  isUsed: boolean;
}
