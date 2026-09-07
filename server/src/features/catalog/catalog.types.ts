export interface HoverMediaDTO {
  url: string;
  mediaType: "image" | "video";
}

export interface ProductListItemDTO {
  productId: number;
  itemId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  hoverMedia: HoverMediaDTO | null;
  metal: string | null;
  diamondType: string | null;
  totalCarat: number | null;
  stoneShape: string | null;
  avgRating: number | null;
  reviewCount: number;
}

export interface FilterOptionValueDTO {
  value: string;
  label: string;
  count: number;
}

export interface FilterOptionDTO {
  key: string;
  label: string;
  values: FilterOptionValueDTO[];
}

export type CatalogSort = "best-sellers" | "price-asc" | "price-desc";

export interface CatalogFilters {
  metal?: string;
  diamondType?: string;
  stoneShape?: string;
  caratMin?: number;
  caratMax?: number;
  priceMin?: number;
  priceMax?: number;
  q?: string;
  sort: CatalogSort;
  page: number;
  pageSize: number;
}

export interface CatalogResponseDTO {
  items: ProductListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
  availableFilters: FilterOptionDTO[];
}

export interface Category {
  id: number;
  slug: string;
  name: string;
}
