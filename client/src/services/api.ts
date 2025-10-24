import axios, { AxiosResponse } from 'axios';
import { 
  Product, 
  ProductsResponse, 
  Cart, 
  Order, 
  OrdersResponse, 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  CheckoutData,
  AuthResponse 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', credentials),
  
  register: (credentials: RegisterCredentials): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', credentials),
  
  getCurrentUser: (token?: string): Promise<AxiosResponse<{ user: User }>> =>
    api.get('/auth/me', token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<{ user: User }>> =>
    api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<{ message: string }>> =>
    api.put('/auth/change-password', data),
};

// Products API
export const productsAPI = {
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    featured?: boolean;
  }): Promise<AxiosResponse<ProductsResponse>> =>
    api.get('/products', { params }),
  
  getProduct: (id: string): Promise<AxiosResponse<{ product: Product }>> =>
    api.get(`/products/${id}`),
  
  getCategories: (): Promise<AxiosResponse<{ categories: string[] }>> =>
    api.get('/products/categories/list'),
  
  addReview: (productId: string, data: { rating: number; comment?: string }): Promise<AxiosResponse<{ product: Product }>> =>
    api.post(`/products/${productId}/reviews`, data),
};

// Cart API
export const cartAPI = {
  getCart: (): Promise<AxiosResponse<{ cart: Cart }>> =>
    api.get('/cart'),
  
  addToCart: (productId: string, quantity: number): Promise<AxiosResponse<{ cart: Cart }>> =>
    api.post('/cart/add', { productId, quantity }),
  
  updateCartItem: (productId: string, quantity: number): Promise<AxiosResponse<{ cart: Cart }>> =>
    api.put('/cart/update', { productId, quantity }),
  
  removeFromCart: (productId: string): Promise<AxiosResponse<{ cart: Cart }>> =>
    api.delete('/cart/remove', { data: { productId } }),
  
  clearCart: (): Promise<AxiosResponse<{ cart: Cart }>> =>
    api.delete('/cart/clear'),
  
  getCartCount: (): Promise<AxiosResponse<{ count: number }>> =>
    api.get('/cart/count'),
};

// Orders API
export const ordersAPI = {
  createOrder: (data: CheckoutData): Promise<AxiosResponse<{ order: Order }>> =>
    api.post('/orders', data),
  
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<AxiosResponse<OrdersResponse>> =>
    api.get('/orders', { params }),
  
  getOrder: (id: string): Promise<AxiosResponse<{ order: Order }>> =>
    api.get(`/orders/${id}`),
  
  cancelOrder: (id: string): Promise<AxiosResponse<{ order: Order }>> =>
    api.put(`/orders/${id}/cancel`),
};

// Users API
export const usersAPI = {
  getProfile: (): Promise<AxiosResponse<{ user: User }>> =>
    api.get('/users/profile'),
  
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<{ user: User }>> =>
    api.put('/users/profile', data),
  
  getUserOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<AxiosResponse<OrdersResponse>> =>
    api.get('/users/orders', { params }),
  
  getUserStats: (): Promise<AxiosResponse<{
    totalOrders: number;
    totalSpent: number;
    recentOrders: Order[];
  }>> =>
    api.get('/users/stats'),
  
  deleteAccount: (password: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete('/users/account', { data: { password } }),
};

// Admin API
export const adminAPI = {
  getDashboard: (): Promise<AxiosResponse<{
    stats: {
      totalUsers: number;
      totalProducts: number;
      totalOrders: number;
      totalRevenue: number;
      monthlyRevenue: number;
    };
    recentOrders: Order[];
    topProducts: Array<{
      id: string;
      name: string;
      totalSold: number;
    }>;
  }>> =>
    api.get('/admin/dashboard'),
  
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<AxiosResponse<{
    users: User[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalUsers: number;
    };
  }>> =>
    api.get('/admin/users', { params }),
  
  updateUserRole: (userId: string, role: 'user' | 'admin'): Promise<AxiosResponse<{ user: User }>> =>
    api.put(`/admin/users/${userId}/role`, { role }),
  
  deleteUser: (userId: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/admin/users/${userId}`),
  
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<AxiosResponse<{
    products: Product[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalProducts: number;
    };
  }>> =>
    api.get('/admin/products', { params }),
  
  updateProductStatus: (productId: string, data: {
    isActive: boolean;
    isFeatured?: boolean;
  }): Promise<AxiosResponse<{ product: Product }>> =>
    api.put(`/admin/products/${productId}/status`, data),
  
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AxiosResponse<OrdersResponse>> =>
    api.get('/admin/orders', { params }),
  
  updateOrderStatus: (orderId: string, data: {
    status: string;
    note?: string;
  }): Promise<AxiosResponse<{ order: Order }>> =>
    api.put(`/admin/orders/${orderId}/status`, data),

  // Product Management
  createProduct: (data: Partial<Product>): Promise<AxiosResponse<{ product: Product }>> =>
    api.post('/products', data),
  
  updateProduct: (productId: string, data: Partial<Product>): Promise<AxiosResponse<{ product: Product }>> =>
    api.put(`/products/${productId}`, data),
  
  deleteProduct: (productId: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/products/${productId}`),
};

// Image Upload API
export const imageAPI = {
  uploadImage: (formData: FormData): Promise<AxiosResponse<{ imageUrl: string; filename: string }>> =>
    api.post('/products/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export default api;
