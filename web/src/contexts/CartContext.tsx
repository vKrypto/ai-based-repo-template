import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from "react";
import { fetchJson, sendJson } from "../lib/apiClient.js";
import type { CartDTO } from "../lib/cartTypes.js";

const EMPTY_CART: CartDTO = { items: [], itemCount: 0, subtotal: 0 };

interface CartContextValue {
  cart: CartDTO;
  isLoading: boolean;
  addItem: (itemId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }): ReactElement {
  const [cart, setCart] = useState<CartDTO>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh(): Promise<void> {
    const nextCart = await fetchJson<CartDTO>("/api/cart");
    setCart(nextCart);
  }

  useEffect(() => {
    setIsLoading(true);
    refresh()
      .catch(() => setCart(EMPTY_CART))
      .finally(() => setIsLoading(false));
  }, []);

  async function addItem(itemId: string, quantity = 1): Promise<void> {
    const nextCart = await sendJson<CartDTO>("POST", "/api/cart/items", { itemId, quantity });
    setCart(nextCart);
  }

  async function updateQuantity(itemId: string, quantity: number): Promise<void> {
    const nextCart = await sendJson<CartDTO>("PATCH", `/api/cart/items/${itemId}`, { quantity });
    setCart(nextCart);
  }

  async function removeItem(itemId: string): Promise<void> {
    const nextCart = await sendJson<CartDTO>("DELETE", `/api/cart/items/${itemId}`);
    setCart(nextCart);
  }

  return (
    <CartContext.Provider value={{ cart, isLoading, addItem, updateQuantity, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
