export interface WishlistItemDTO {
  itemId: string;
  productId: number;
  categorySlug: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  metal: string | null;
}

export interface WishlistDTO {
  items: WishlistItemDTO[];
}
