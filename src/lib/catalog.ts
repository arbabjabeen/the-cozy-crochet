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

export const products: Product[] = [
  {
    slug: "rose-bouquet-keychain",
    name: "Rose Bouquet Keychain",
    category: "keychain",
    price: 5,
    image: "/products/rose-bouquet-keychain.png",
    badge: "",
    description: "beautiful and fantastic roses bouquet that enhance your look and personality.",
    stock: 1,
    rating: 5,
    numReviews: 4,
  },
  {
    slug: "crochet-tulip-hair-tie",
    name: "Crochet Tulip Hair Tie",
    category: "Hair Accessories",
    price: 10,
    image: "/products/crochet-tulip-hair-tie.jpg",
    badge: "BestSeller",
    description: "Cute handmade crochet tulip hair tie, perfect for adding a soft and colorful floral touch to your everyday hairstyle. 🧶🌷",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "crochet-octopus-bag-charm",
    name: "crochet Octopus Bag Charm",
    category: "Bag charms",
    price: 10,
    image: "/products/crochet-octopus-bag-charm.jpg",
    badge: "",
    description: "Cute handmade crochet octopus charm, perfect for decorating your handbag, tote, or backpack with a fun handmade touch. 🧶💕",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "crochet-rose-flower-keychain",
    name: "Crochet Rose Flower Keychain",
    category: "keychain",
    price: 5,
    image: "/products/crochet-rose-flower-keychain.jpg",
    badge: "",
    description: "Handmade crochet rose flower keychain, perfect for adding a cute and elegant touch to your keys, bags, or backpacks. Lightweight, durable, and made with love—an adorable gift for flower and crochet lovers.",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "handmade-crochet-bag",
    name: "Handmade Crochet Bag",
    category: "Bags",
    price: 15,
    image: "/products/handmade-crochet-bag.jpg",
    badge: "",
    description: "Stylish handmade crochet bag with a unique woven design, perfect for everyday use, casual outings, and adding a cozy handmade touch to your look. 🧶✨",
    stock: 1,
    rating: 5,
    numReviews: 3,
  },
  {
    slug: "handmade-crochet-bag-2",
    name: "Handmade Crochet Bag",
    category: "Bags",
    price: 15,
    image: "/products/handmade-crochet-bag-2.jpg",
    badge: "",
    description: "Stylish handmade crochet bag with a unique woven design, perfect for everyday use, casual outings, and adding a cozy handmade touch to your look. 🧶✨",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "crochet-bear-bag-charm",
    name: "Crochet Bear Bag Charm",
    category: "Bag charms",
    price: 10,
    image: "/products/crochet-bear-bag-charm.jpg",
    badge: "",
    description: "Cute handmade crochet bear charm, perfect for adding a playful and cozy touch to your handbag, tote, or backpack. 🧸🤎",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "crochet-bear-keychain",
    name: "Crochet Bear Keychain",
    category: "keychain",
    price: 10,
    image: "/products/crochet-bear-keychain.jpg",
    badge: "",
    description: "Adorable handmade crochet bear keychain, perfect for decorating your keys, bags, or backpack with a cute handmade touch. 🧸🧶",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "crochet-bear-amigurumi",
    name: "Crochet Bear Amigurumi",
    category: "Amigurumi",
    price: 10,
    image: "/products/crochet-bear-amigurumi.jpg",
    badge: "",
    description: "Cute handmade crochet bear amigurumi, soft and adorable with a lovely handmade finish. Perfect for gifting or adding a cozy touch to your collection. 🧶🤎",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "crochet-tulip-bag-charm",
    name: "Crochet Tulip Bag Charm",
    category: "Bag charms",
    price: 10,
    image: "/products/crochet-tulip-bag-charm.jpg",
    badge: "",
    description: "Cute handmade crochet tulip charm, perfect for decorating your handbag, tote, or backpack with a beautiful floral touch. 🧶🌷",
    stock: 1,
    rating: 5,
    numReviews: 2,
  },
  {
    slug: "crochet-flip-flop-bag-charm",
    name: "Crochet Flip Flop Bag Charm",
    category: "Bag charms",
    price: 5,
    image: "/products/crochet-flip-flop-bag-charm.jpg",
    badge: "",
    description: "Adorable handmade crochet flip flop charm, perfect for adding a playful handmade touch to your handbag, tote, or backpack. 🧶✨",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "crochet-flip-flop-keychain",
    name: "Crochet Flip Flop Keychain",
    category: "keychain",
    price: 5,
    image: "/products/crochet-flip-flop-keychain.jpg",
    badge: "",
    description: "Cute handmade crochet flip flop keychain, perfect for decorating your keys, bags, or backpacks with a fun and unique touch. 🧶💕",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "crochet-bouquet-keychain",
    name: "Crochet Bouquet Keychain",
    category: "keychain",
    price: 5,
    image: "/products/crochet-bouquet-keychain.jpg",
    badge: "BestSeller",
    description: "Beautiful handmade crochet flower bouquet keychain, perfect for decorating your keys, bags, or backpack with a cute floral touch. 🧶🌸",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "handmade-crochet-octopus-keychain",
    name: "Handmade Crochet Octopus keychain",
    category: "keychain",
    price: 5,
    image: "/products/handmade-crochet-octopus-keychain.jpg",
    badge: "",
    description: "Cute handmade crochet octopus keychain, perfect for adding a fun and colorful touch to your keys, bags, or backpacks. 🧶💕",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
  {
    slug: "handmade-crochet-octopus",
    name: "Handmade Crochet Octopus",
    category: "Amigurumi",
    price: 5,
    image: "/products/handmade-crochet-octopus.jpg",
    badge: "",
    description: "Cute handmade crochet octopus, soft and lightweight with adorable details. Perfect as a cute décor piece, gift, or little companion. 🧶💕",
    stock: 1,
    rating: 5,
    numReviews: 1,
  },
];

export const money = (value: number) => `$${value.toFixed(2)}`;