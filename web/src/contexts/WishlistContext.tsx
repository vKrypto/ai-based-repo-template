import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from "react";
import { fetchJson, sendJson } from "../lib/apiClient.js";
import type { WishlistDTO } from "../lib/wishlistTypes.js";

const EMPTY_WISHLIST: WishlistDTO = { items: [] };

interface WishlistContextValue {
  wishlist: WishlistDTO;
  isLoading: boolean;
  isInWishlist: (itemId: string) => boolean;
  toggleItem: (itemId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }): ReactElement {
  const [wishlist, setWishlist] = useState<WishlistDTO>(EMPTY_WISHLIST);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchJson<WishlistDTO>("/api/wishlist")
      .then(setWishlist)
      .catch(() => setWishlist(EMPTY_WISHLIST))
      .finally(() => setIsLoading(false));
  }, []);

  function isInWishlist(itemId: string): boolean {
    return wishlist.items.some((item) => item.itemId === itemId);
  }

  async function toggleItem(itemId: string): Promise<void> {
    const nextWishlist = isInWishlist(itemId)
      ? await sendJson<WishlistDTO>("DELETE", `/api/wishlist/items/${itemId}`)
      : await sendJson<WishlistDTO>("POST", "/api/wishlist/items", { itemId });
    setWishlist(nextWishlist);
  }

  return (
    <WishlistContext.Provider value={{ wishlist, isLoading, isInWishlist, toggleItem }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
