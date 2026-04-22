"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersService, type CreateOrderPayload, type CreateDisputePayload } from "@/lib/api/services/orders.service";
import { QUERY_KEYS } from "@/lib/constants";

export function useOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS,
    queryFn: ordersService.getMyOrders,
    staleTime: 2 * 60 * 1000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ORDER(id),
    queryFn: () => ordersService.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS });
    },
  });
}

export function useCreateDispute() {
  return useMutation({
    mutationFn: (payload: CreateDisputePayload) => ordersService.createDispute(payload),
  });
}
