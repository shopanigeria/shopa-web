"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { productsService, type ProductsQuery } from "@/lib/api/services/products.service";
import { QUERY_KEYS } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api";
import type { Category } from "@/types";

function useCampusId(): string | undefined {
  const { user } = useAuthStore();
  return user?.campus?.id ?? user?.campusId ?? undefined;
}

export function useProducts(query: ProductsQuery = {}) {
  const campusId = useCampusId();
  const q = { ...query, ...(campusId ? { campusId } : {}) };
  return useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, q],
    queryFn: () => productsService.getAll(q),
    staleTime: 0,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCT(id),
    queryFn: () => productsService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: productsService.getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePopularProducts() {
  const campusId = useCampusId();
  return useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, "popular", campusId],
    queryFn: () => productsService.getPopular(campusId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubcategories(categoryId: string | null) {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>(`/categories/${categoryId}/subcategories`);
      const arr = Array.isArray(data) ? data : ((data as { data?: Category[] })?.data ?? []);
      return arr as Category[];
    },
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryProducts(categoryId: string, query: ProductsQuery = {}) {
  const campusId = useCampusId();
  const q = { ...query, ...(campusId ? { campusId } : {}) };
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, "category", categoryId, q],
    queryFn: ({ pageParam = 1 }) =>
      productsService.getByCategory(categoryId, { ...q, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    enabled: !!categoryId,
  });
}
