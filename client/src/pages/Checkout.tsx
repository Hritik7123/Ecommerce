import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI } from '../services/api';
import { CheckoutData, ShippingAddress, Order } from '../types';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  MapPin, 
  User, 
  ShoppingBag, 
  Lock, 
  ArrowLeft,
  CheckCircle,
  Shield
} from 'lucide-react';

interface CheckoutFormData {
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  paymentMethod: {
    type: 'card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  };
  notes: string;
  useBillingAddress: boolean;
}

const Checkout: React.FC = () => {
  const { cart, cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
    defaultValues: {
      shippingAddress: {
        name: user?.name || '',
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || '',
        phone: user?.phone || ''
      },
      billingAddress: {
        name: user?.name || '',
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || '',
        phone: user?.phone || ''
      },
      paymentMethod: {
        type: 'card'
      },
      notes: '',
      useBillingAddress: false
    }
  });

  const useBillingAddress = watch('useBillingAddress');

  useEffect(() => {
    if (!cart || cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cart, cartItems, navigate]);

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setLoading(true);
      
      const checkoutData: CheckoutData = {
        shippingAddress: data.shippingAddress,
        billingAddress: data.useBillingAddress ? data.billingAddress : undefined,
        paymentMethod: data.paymentMethod,
        notes: data.notes
      };

      const response = await ordersAPI.createOrder(checkoutData);
      setOrder(response.data.order);
      setOrderSuccess(true);
      await clearCart();
      toast.success('Order placed successfully!');
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCart = () => {
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  if (orderSuccess && order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600">Your order has been confirmed and will be processed soon.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Order Number:</span> {order.orderNumber}</p>
              <p><span className="font-medium">Total Amount:</span> ${(Number(order.total) || 0).toFixed(2)}</p>
              <p><span className="font-medium">Status:</span> {order.status}</p>
              <p><span className="font-medium">Payment Status:</span> {order.paymentStatus}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleContinueShopping}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checkout.</p>
          <button
            onClick={handleContinueShopping}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={handleBackToCart}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <MapPin className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    {...register('shippingAddress.name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.shippingAddress?.name && (
                    <p className="text-red-500 text-sm">{errors.shippingAddress.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    {...register('shippingAddress.phone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                <input
                  {...register('shippingAddress.street', { required: 'Street address is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.shippingAddress?.street && (
                  <p className="text-red-500 text-sm">{errors.shippingAddress.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    {...register('shippingAddress.city', { required: 'City is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.shippingAddress?.city && (
                    <p className="text-red-500 text-sm">{errors.shippingAddress.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    {...register('shippingAddress.state', { required: 'State is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.shippingAddress?.state && (
                    <p className="text-red-500 text-sm">{errors.shippingAddress.state.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                  <input
                    {...register('shippingAddress.zipCode', { required: 'ZIP code is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.shippingAddress?.zipCode && (
                    <p className="text-red-500 text-sm">{errors.shippingAddress.zipCode.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input
                  {...register('shippingAddress.country', { required: 'Country is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.shippingAddress?.country && (
                  <p className="text-red-500 text-sm">{errors.shippingAddress.country.message}</p>
                )}
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <User className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">Billing Address</h2>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('useBillingAddress')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Same as shipping address</span>
                </label>
              </div>

              {!useBillingAddress && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        {...register('billingAddress.name', { 
                          required: !useBillingAddress ? 'Name is required' : false 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.billingAddress?.name && (
                        <p className="text-red-500 text-sm">{errors.billingAddress.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        {...register('billingAddress.phone')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                    <input
                      {...register('billingAddress.street', { 
                        required: !useBillingAddress ? 'Street address is required' : false 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.billingAddress?.street && (
                      <p className="text-red-500 text-sm">{errors.billingAddress.street.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        {...register('billingAddress.city', { 
                          required: !useBillingAddress ? 'City is required' : false 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.billingAddress?.city && (
                        <p className="text-red-500 text-sm">{errors.billingAddress.city.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input
                        {...register('billingAddress.state', { 
                          required: !useBillingAddress ? 'State is required' : false 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.billingAddress?.state && (
                        <p className="text-red-500 text-sm">{errors.billingAddress.state.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                      <input
                        {...register('billingAddress.zipCode', { 
                          required: !useBillingAddress ? 'ZIP code is required' : false 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.billingAddress?.zipCode && (
                        <p className="text-red-500 text-sm">{errors.billingAddress.zipCode.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      {...register('billingAddress.country', { 
                        required: !useBillingAddress ? 'Country is required' : false 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.billingAddress?.country && (
                      <p className="text-red-500 text-sm">{errors.billingAddress.country.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    value="card"
                    {...register('paymentMethod.type')}
                    className="mr-3"
                  />
                  <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                  <span>Credit/Debit Card</span>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    value="paypal"
                    {...register('paymentMethod.type')}
                    className="mr-3"
                  />
                  <span>PayPal</span>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    value="cash_on_delivery"
                    {...register('paymentMethod.type')}
                    className="mr-3"
                  />
                  <span>Cash on Delivery</span>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Notes</h2>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Any special instructions for your order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-4">
                    <img
                      src={item.product.images?.[0]?.url || '/api/placeholder/60/60'}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="font-medium text-gray-900">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${(Number(totalPrice) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>${(Number(totalPrice) || 0).toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Lock className="h-5 w-5 mr-2" />
                )}
                {loading ? 'Processing...' : 'Place Order'}
              </button>

              <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
                <Shield className="h-4 w-4 mr-2" />
                <span>Secure checkout with SSL encryption</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
