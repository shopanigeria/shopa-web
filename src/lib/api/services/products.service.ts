import { apiClient } from "../client";
import type { Product, PaginatedResponse, Category } from "@/types";

export interface ProductsQuery {
  page?: number; limit?: number; categoryId?: string;
  search?: string; minPrice?: number; maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular";
}

export const productsService = {
  getAll: async (query: ProductsQuery = {}): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>("/products", { params: query });
    return data;
  },
  getById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },
  getPopular: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>("/products/popular");
    return data;
  },
  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>("/categories");
    return data;
  },
  getByCategory: async (categoryId: string, query: ProductsQuery = {}): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>(`/categories/${categoryId}/products`, { params: query });
    return data;
  },
};
