export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number | null;
  image: string | null;
  quantity: number;
  stock: number;
}
