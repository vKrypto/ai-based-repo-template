export interface ShippingAddressInput {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface ShippingAddressDTO {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
}

export interface OrderItemDTO {
  itemId: string | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  lineTotal: number;
}

export interface OrderDTO {
  orderId: number;
  status: string;
  subtotal: number;
  shippingAddress: ShippingAddressDTO;
  items: OrderItemDTO[];
  createdAt: string;
}

export interface CartLineForOrder {
  variantId: number;
  itemId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}
