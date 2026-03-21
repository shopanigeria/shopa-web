"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { productsService, type ProductsQuery } from "@/lib/api/services/products.service";
import { QUERY_KEYS } from "@/lib/constants";

export function useProducts(query: ProductsQuery = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, query],
    queryFn: () => productsService.getAll(query),
    staleTime: 2 * 60 * 1000,
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
  return useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, "popular"],
    queryFn: productsService.getPopular,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryProducts(categoryId: string, query: ProductsQuery = {}) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, "category", categoryId, query],
    queryFn: ({ pageParam = 1 }) =>
      productsService.getByCategory(categoryId, { ...query, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    enabled: !!categoryId,
  });
}
