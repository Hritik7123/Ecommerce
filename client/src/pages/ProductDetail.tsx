import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Star, ShoppingCart, Heart, Truck, Shield, RotateCcw } from 'lucide-react';
import { productsAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery(
    ['product', id],
    () => productsAPI.getProduct(id!),
    {
      enabled: !!id,
      select: (response) => response.data.product,
    }
  );

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }

    if (!data) return;

    try {
      await addToCart(data.id, 1);
    } catch (error) {
      // Error is handled in the context
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-12" />;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-w-1 aspect-h-1">
            <img
              src={data.images[0]?.url || '/api/placeholder/600/600'}
              alt={data.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
          {data.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {data.images.slice(1, 5).map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.alt || data.name}
                  className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-75"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.name}</h1>
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {renderStars(data.rating.average)}
              </div>
              <span className="text-sm text-gray-500 ml-2">
                ({data.rating.count} reviews)
              </span>
            </div>
            <p className="text-gray-600 text-lg">{data.description}</p>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold text-primary-600">
              {formatPrice(data.price)}
            </span>
            {data.originalPrice && data.originalPrice > data.price && (
              <span className="text-xl text-gray-500 line-through">
                {formatPrice(data.originalPrice)}
              </span>
            )}
            {data.discount > 0 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                -{data.discount}%
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Stock:</span>
              <span className={`ml-2 font-medium ${
                data.stock > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.stock > 0 ? `${data.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <div>
              <span className="text-sm text-gray-500">Category:</span>
              <span className="ml-2 font-medium capitalize">{data.category}</span>
            </div>

            {data.brand && (
              <div>
                <span className="text-sm text-gray-500">Brand:</span>
                <span className="ml-2 font-medium">{data.brand}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={cartLoading || data.stock === 0}
              className="flex-1 btn btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {data.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button className="btn btn-outline flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-primary-600" />
              <span className="text-sm">Free Shipping</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary-600" />
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-primary-600" />
              <span className="text-sm">30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Specifications */}
      {data.specifications && (
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b">
                <span className="font-medium capitalize">{key}:</span>
                <span className="text-gray-600">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {data.reviews.length > 0 && (
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h3>
          <div className="space-y-4">
            {data.reviews.map((review) => (
              <div key={review.id} className="card p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{review.user.name}</span>
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-gray-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
