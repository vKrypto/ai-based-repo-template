export interface RawBlueNileStone {
  stoneTypeName: string;
  totalCarat: number;
  color: string | null;
  clarity: string | null;
  shape: string | null;
}

export interface RawBlueNileProduct {
  itemID: number;
  title: string;
  price: number;
  salePrice: number | null;
  url: string;
  media: { thumb: string };
  jewel: {
    metal: { type: string };
    stones: RawBlueNileStone[] | null;
    allMedia: Array<{
      orbitvu?: { ratio100?: { image?: { gallery?: string[] } } };
    }>;
  };
}

const SSR_DATA_PATTERN = /<script type="application\/json" data-app-selector="ssrData">(.*?)<\/script>/s;

export function parseSsrDataHtml(html: string): RawBlueNileProduct[] {
  const match = html.match(SSR_DATA_PATTERN);
  if (!match?.[1]) {
    return [];
  }

  const data = JSON.parse(match[1]) as {
    ssrPageData: { items: Array<Array<{ product: RawBlueNileProduct }>> };
  };

  return data.ssrPageData.items.flat().map((entry) => entry.product);
}
