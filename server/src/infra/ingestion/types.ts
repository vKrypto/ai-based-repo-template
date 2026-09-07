export interface IngestedProduct {
  itemId: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  groupKey: string | null;
  metalType: string;
  diamondType: string;
  totalCarat: number;
  stoneShape: string;
  sourceUrl: string | null;
  images: string[];
  isSynthetic: boolean;
}
