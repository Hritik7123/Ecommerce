import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, loading } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }

    try {
      await addToCart(product.id, 1);
    } catch (error) {
      // Error is handled in the context
    }
  };

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
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="card group hover:shadow-lg transition-shadow duration-300">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative overflow-hidden">
          <img
            src={product.images[0]?.url || '/api/placeholder/300/300'}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
              -{product.discount}%
            </div>
          )}
          {product.isFeatured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm font-semibold">
              Featured
            </div>
          )}
          <button className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50">
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {renderStars(product.rating?.average || 0)}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              ({product.rating?.count || 0})
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddToCart}
              disabled={loading || product.stock === 0}
              className="flex-1 btn btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
