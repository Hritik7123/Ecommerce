import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowRight, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/Product/ProductCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Home: React.FC = () => {
  const { data: featuredProducts, isLoading } = useQuery(
    'featured-products',
    () => productsAPI.getProducts({ featured: true, limit: 8 }),
    {
      select: (response) => response.data.products,
    }
  );

  const features = [
    {
      icon: <Truck className="w-8 h-8 text-primary-600" />,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50'
    },
    {
      icon: <Shield className="w-8 h-8 text-primary-600" />,
      title: 'Secure Payment',
      description: 'Your payment information is safe and secure'
    },
    {
      icon: <RotateCcw className="w-8 h-8 text-primary-600" />,
      title: 'Easy Returns',
      description: '30-day return policy for all products'
    }
  ];

  const categories = [
    { name: 'Electronics', image: '/api/placeholder/300/200', link: '/products?category=electronics' },
    { name: 'Clothing', image: '/api/placeholder/300/200', link: '/products?category=clothing' },
    { name: 'Home & Garden', image: '/api/placeholder/300/200', link: '/products?category=home' },
    { name: 'Sports', image: '/api/placeholder/300/200', link: '/products?category=sports' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to Our
              <span className="block text-yellow-300">E-Commerce Store</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Discover amazing products at unbeatable prices. Shop with confidence and enjoy fast, secure delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                Shop Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/products?featured=true"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-600 transition-colors inline-flex items-center justify-center"
              >
                Featured Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-gray-600">Find exactly what you're looking for</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={category.link}
                className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <h3 className="text-white text-xl font-semibold">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Handpicked products just for you</p>
          </div>
          
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link
              to="/products?featured=true"
              className="btn btn-primary inline-flex items-center"
            >
              View All Featured Products
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new products, special offers, and exclusive deals.
          </p>
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
            <button className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-r-lg font-semibold hover:bg-yellow-300 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
