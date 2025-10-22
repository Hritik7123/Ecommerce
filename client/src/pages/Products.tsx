import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Filter, Grid, List, ChevronDown } from 'lucide-react';
import { productsAPI } from '../services/api';
import ProductCard from '../components/Product/ProductCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const { data, isLoading, error } = useQuery(
    ['products', page, category, search, sort, minPrice, maxPrice],
    () => productsAPI.getProducts({
      page,
      category: category || undefined,
      search: search || undefined,
      sort,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      limit: 12,
    }),
    {
      keepPreviousData: true,
    }
  );

  const { data: categories } = useQuery(
    'categories',
    () => productsAPI.getCategories(),
    {
      select: (response) => response.data.categories,
    }
  );

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to first page when filtering
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: string) => {
    handleFilterChange('sort', newSort);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
    { value: '-name', label: 'Name: Z to A' },
    { value: '-rating', label: 'Highest Rated' },
  ];

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Products</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64">
          <div className="lg:sticky lg:top-24">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Category Filter */}
                <div>
                  <h4 className="font-medium mb-3">Category</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value=""
                        checked={!category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="mr-2"
                      />
                      All Categories
                    </label>
                    {categories?.map((cat) => (
                      <label key={cat} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={cat}
                          checked={category === cat}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          className="mr-2"
                        />
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h4 className="font-medium mb-3">Price Range</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="input"
                    />
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={clearFilters}
                  className="w-full btn btn-outline"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {search ? `Search Results for "${search}"` : 'All Products'}
              </h1>
              {data && (
                <p className="text-gray-600">
                  {data.data.pagination.totalItems} products found
                </p>
              )}
            </div>

            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          {isLoading ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : data?.data.products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or search terms.</p>
              <button
                onClick={clearFilters}
                className="btn btn-primary"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {data?.data.products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-12">
              <button
                onClick={() => handleFilterChange('page', (page - 1).toString())}
                disabled={!data.data.pagination.hasPrev}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, data.data.pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handleFilterChange('page', pageNum.toString())}
                      className={`px-3 py-2 rounded-lg ${
                        pageNum === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handleFilterChange('page', (page + 1).toString())}
                disabled={!data.data.pagination.hasNext}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
