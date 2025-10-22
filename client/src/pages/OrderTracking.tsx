import React, { useState } from 'react';
import api from '../services/api';
import { Package, Clock, Truck, CheckCircle, XCircle, RotateCcw, Search } from 'lucide-react';

interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  currentStatus: {
    status: string;
    paymentStatus: string;
    trackingNumber?: string;
    lastUpdate: string;
  };
  timeline: Array<{
    status: string;
    note: string;
    actor: string;
    timestamp: string;
    id: string;
  }>;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

const OrderTracking: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [orderData, setOrderData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/orders/track/${orderNumber}`);
      setOrderData(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Order not found');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing': return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'returned': return <RotateCcw className="w-5 h-5 text-orange-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-600">Enter your order number to track your package</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleTrackOrder} className="mb-8">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter order number (e.g., ORD-1234567890-0001)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Order Tracking Results */}
        {orderData && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Order Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order #{orderData.orderNumber}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Placed on {formatDate(orderData.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
                    {getStatusIcon(orderData.status)}
                    <span className="ml-2">{orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Status</h3>
              <div className="flex items-center space-x-4">
                {getStatusIcon(orderData.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Last updated: {formatDate(orderData.currentStatus.lastUpdate)}
                  </p>
                  {orderData.trackingNumber && (
                    <p className="text-sm text-blue-600 mt-1">
                      Tracking Number: {orderData.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            {orderData.estimatedDelivery && (
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Estimated Delivery</h3>
                <p className="text-sm text-gray-600">
                  {formatDate(orderData.estimatedDelivery)}
                </p>
              </div>
            )}

            {/* Timeline */}
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
              <div className="space-y-4">
                {orderData.timeline.map((entry, index) => (
                  <div key={entry.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(entry.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">{entry.note}</p>
                      <p className="text-xs text-gray-400">by {entry.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-blue-800 text-sm mb-4">
            If you're having trouble tracking your order, please contact our customer support.
          </p>
          <div className="flex space-x-4">
            <a
              href="mailto:support@ecommerce.com"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Email Support
            </a>
            <a
              href="tel:+15551234567"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Call Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
