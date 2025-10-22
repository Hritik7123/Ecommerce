export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand?: string;
  images: Array<{
    url: string;
    alt: string;
  }>;
  stock: number;
  sku?: string;
  rating: {
    average: number;
    count: number;
  };
  reviews: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
  isActive: boolean;
  isFeatured: boolean;
  discount: number;
  tags: string[];
  specifications?: {
    weight?: string;
    dimensions?: string;
    color?: string;
    material?: string;
    warranty?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  user: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  user: string | {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: {
    type: 'card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
    details?: {
      cardLast4?: string;
      cardBrand?: string;
      paypalEmail?: string;
    };
  };
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  trackingNumber?: string;
  notes?: string;
  timeline: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: PaginationInfo;
}

export interface CartResponse {
  cart: Cart;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface CheckoutData {
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: {
    type: 'card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  };
  notes?: string;
}
