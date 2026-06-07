export type MerchProduct = {
  id: string;
  title: string;
  price: number;
  image: string;
  requiresSize: boolean;
};

export const MERCH_PRODUCTS: MerchProduct[] = [
  {
    id: "cd-preorder",
    title: "LIVE ALBUM PRE-ORDER",
    price: 20,
    image: "/logo.png",
    requiresSize: false,
  },
  {
    id: "concert-tee",
    title: "300 AWAKENING CONCERT TEE",
    price: 25,
    image: "/logo.png",
    requiresSize: true,
  },
  {
    id: "choir-hoodie",
    title: "THE SOUND OF HEALING HOODIE",
    price: 50,
    image: "/logo.png",
    requiresSize: true,
  },
];

export const MERCH_SIZES = ["S", "M", "L", "XL", "2XL"] as const;

export type MerchSize = (typeof MERCH_SIZES)[number];

export function getMerchProduct(productId: string): MerchProduct | undefined {
  return MERCH_PRODUCTS.find((product) => product.id === productId);
}
