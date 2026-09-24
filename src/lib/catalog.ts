export type Review = {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string | any;
  badge?: string;
  description: string;
  stock: number;
  rating?: number;
  numReviews?: number;
  reviews?: Review[];
};

export const getProductImage = (img: any): string => {
  if (typeof img === "string") return img;
  if (img && typeof img === "object" && img.src) return img.src;
  return "/assets/cloud-throw.jpg";
};

// Initial catalog is clean and empty so AJ can add real handcrafted products
export const products: Product[] = [];

export const money = (value: number) => `$${value.toFixed(2)}`;