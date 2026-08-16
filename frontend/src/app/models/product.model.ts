export interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  location: string;
  description: string;
  sellerId: string | { _id: string; name: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductPayload {
  name: string;
  price: number;
  location: string;
  description: string;
  imageFile?: File | null;
}
