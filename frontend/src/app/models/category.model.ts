export interface Category {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryPayload {
  name: string;
}
