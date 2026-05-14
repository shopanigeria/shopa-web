import { apiClient } from "../client";
import type { Product, PaginatedResponse, Category } from "@/types";

export interface ProductsQuery {
  page?: number; limit?: number; categoryId?: string;
  search?: string; minPrice?: number; maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular";
  campusId?: string;
}

// Normalise a raw API product so both images[] and imageUrls[] work,
// and price is always a number
function normalise(p: Record<string, unknown>): Product {
  // Backend may return review count as _count.reviews or reviewCount
  const _count = p._count as Record<string, number> | undefined;
  const reviewCount =
    (p.reviewCount as number | undefined) ??
    _count?.reviews ??
    0;

  // Backend may return average rating as averageRating, avgRating, or rating
  const rating =
    (p.averageRating as number | undefined) ??
    (p.avgRating as number | undefined) ??
    (p.rating as number | undefined) ??
    0;

  return {
    ...(p as unknown as Product),
    price: typeof p.price === "string" ? parseFloat(p.price as string) : (p.price as number),
    imageUrls: (p.imageUrls as string[] | undefined) ?? (p.images as string[] | undefined) ?? [],
    images: (p.images as string[] | undefined) ?? [],
    isAvailable: (p.isAvailable as boolean | undefined) ?? (p.isActive as boolean | undefined) ?? true,
    rating,
    reviewCount,
  };
}

function normaliseList(raw: unknown): Product[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((p) => normalise(p as Record<string, unknown>));
}

export const productsService = {
  getAll: async (query: ProductsQuery = {}): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<{ data: unknown[]; meta: PaginatedResponse<Product>["meta"] }>(
      "/products", { params: query }
    );
    return { data: normaliseList(data.data), meta: data.meta };
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Record<string, unknown>>(`/products/${id}`);
    const product = (data?.data ?? data) as Record<string, unknown>;
    return normalise(product);
  },

  getPopular: async (campusId?: string): Promise<Product[]> => {
    const params: Record<string, unknown> = { limit: 10 };
    if (campusId) params.campusId = campusId;
    try {
      const { data } = await apiClient.get<unknown>("/products/popular", { params });
      if (Array.isArray(data)) return normaliseList(data);
      if (data && typeof data === "object" && "data" in data) return normaliseList((data as { data: unknown }).data);
    } catch {
      // endpoint doesn't exist — fall through
    }
    const { data } = await apiClient.get<{ data: unknown[] }>("/products", { params });
    return normaliseList(data.data ?? data);
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<unknown>("/categories");
    return Array.isArray(data) ? data : ((data as { data?: Category[] })?.data ?? []);
  },

  getByCategory: async (categoryId: string, query: ProductsQuery = {}): Promise<PaginatedResponse<Product>> => {
    // Try the category-scoped endpoint first, fall back to ?categoryId=
    try {
      const { data } = await apiClient.get<{ data: unknown[]; meta: PaginatedResponse<Product>["meta"] }>(
        `/categories/${categoryId}/products`, { params: query }
      );
      return { data: normaliseList(data.data ?? data), meta: data.meta };
    } catch {
      const { data } = await apiClient.get<{ data: unknown[]; meta: PaginatedResponse<Product>["meta"] }>(
        "/products", { params: { ...query, categoryId } }
      );
      return { data: normaliseList(data.data ?? data), meta: data.meta };
    }
  },
};
