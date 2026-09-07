export interface VariantSummaryDTO {
  itemId: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  metal: string | null;
  diamondType: string | null;
  totalCarat: number | null;
  stoneShape: string | null;
}

export interface ProductDetailDTO {
  productId: number;
  itemId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  video: string | null;
  metal: string | null;
  diamondType: string | null;
  totalCarat: number | null;
  stoneShape: string | null;
  avgRating: number | null;
  reviewCount: number;
  siblingVariants: VariantSummaryDTO[];
}
