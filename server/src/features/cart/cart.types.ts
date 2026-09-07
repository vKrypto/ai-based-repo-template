export interface CartItemDTO {
  itemId: string;
  productId: number;
  categorySlug: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  metal: string | null;
  quantity: number;
  lineTotal: number;
}

export interface CartDTO {
  items: CartItemDTO[];
  itemCount: number;
  subtotal: number;
}
