import { apiClient } from "../client";
import type { Product, PaginatedResponse, Category } from "@/types";

export interface ProductsQuery {
  page?: number; limit?: number; categoryId?: string;
  search?: string; minPrice?: number; maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular";
}

// Normalise a raw API product so both images[] and imageUrls[] work,
// and price is always a number
function normalise(p: Record<string, unknown>): Product {
  return {
    ...(p as unknown as Product),
    price: typeof p.price === "string" ? parseFloat(p.price as string) : (p.price as number),
    imageUrls: (p.imageUrls as string[] | undefined) ?? (p.images as string[] | undefined) ?? [],
    images: (p.images as string[] | undefined) ?? [],
    isAvailable: (p.isAvailable as boolean | undefined) ?? (p.isActive as boolean | undefined) ?? true,
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
    return normalise(data);
  },

  getPopular: async (): Promise<Product[]> => {
    // /products/popular may not exist — fall back to sorting by rating
    try {
      const { data } = await apiClient.get<unknown>("/products/popular");
      if (Array.isArray(data)) return normaliseList(data);
      if (data && typeof data === "object" && "data" in data) return normaliseList((data as { data: unknown }).data);
    } catch {
      // endpoint doesn't exist — fall through
    }
    // Fallback: fetch with limit
    const { data } = await apiClient.get<{ data: unknown[] }>("/products", { params: { limit: 10 } });
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
