import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Cart: React.FC = () => {
  const { cartItems, totalItems, totalPrice, updateCartItem, removeFromCart, loading } = useCart();
  const { isAuthenticated } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your cart.</p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  if (totalItems === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart to get started.</p>
          <Link to="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart ({totalItems} items)</h1>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.product.id} className="card p-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={item.product.images[0]?.url || '/api/placeholder/100/100'}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-gray-600">{formatPrice(item.product.price)}</p>
                    <p className="text-sm text-gray-500">
                      {item.product.stock > 0 ? `${item.product.stock} in stock` : 'Out of stock'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateCartItem(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="btn btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItem(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="btn btn-outline p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-600 hover:text-red-800 mt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} items)</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{totalPrice >= 50 ? 'Free' : formatPrice(10)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatPrice(totalPrice * 0.08)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice + (totalPrice >= 50 ? 0 : 10) + totalPrice * 0.08)}</span>
                </div>
              </div>
            </div>
            <Link
              to="/checkout"
              className="w-full btn btn-primary mt-6 text-center"
            >
              Proceed to Checkout
            </Link>
            <Link
              to="/products"
              className="w-full btn btn-outline mt-4 text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
