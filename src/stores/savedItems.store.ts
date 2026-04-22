import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SavedItemsStore {
  savedIds: string[];
  isSaved: (productId: string) => boolean;
  toggleSaved: (productId: string) => void;
  removeSaved: (productId: string) => void;
  clearAll: () => void;
}

export const useSavedItemsStore = create<SavedItemsStore>()(
  persist(
    (set, get) => ({
      savedIds: [],

      isSaved: (productId) => get().savedIds.includes(productId),

      toggleSaved: (productId) => {
        const ids = get().savedIds;
        if (ids.includes(productId)) {
          set({ savedIds: ids.filter((id) => id !== productId) });
        } else {
          set({ savedIds: [...ids, productId] });
        }
      },

      removeSaved: (productId) =>
        set({ savedIds: get().savedIds.filter((id) => id !== productId) }),

      clearAll: () => set({ savedIds: [] }),
    }),
    {
      name: "shopa-saved-items",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
