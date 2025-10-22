import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Cart, CartItem } from '../types';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: Cart | null;
  cartItems: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data.cart);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      setLoading(true);
      await cartAPI.addToCart(productId, quantity);
      await fetchCart();
      toast.success('Item added to cart');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add item to cart';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      await cartAPI.updateCartItem(productId, quantity);
      await fetchCart();
      toast.success('Cart updated');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update cart';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      await cartAPI.removeFromCart(productId);
      await fetchCart();
      toast.success('Item removed from cart');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove item from cart';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      await cartAPI.clearCart();
      await fetchCart();
      toast.success('Cart cleared');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  const value: CartContextType = {
    cart,
    cartItems: cart?.items || [],
    totalItems: cart?.totalItems || 0,
    totalPrice: typeof cart?.totalPrice === 'number' ? cart.totalPrice : (typeof cart?.totalPrice === 'string' ? parseFloat(cart.totalPrice) : 0),
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loading,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
