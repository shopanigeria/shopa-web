import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Product } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Computed
  totalItems: () => number;
  subtotal: () => number;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          set({ items: [...items, { productId: product.id, product, quantity }] });
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        });
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "shopa-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
