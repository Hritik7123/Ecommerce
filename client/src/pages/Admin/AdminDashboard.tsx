import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ShoppingBag, BarChart3, Settings } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const adminMenuItems = [
    {
      title: 'Product Management',
      description: 'Add, edit, and manage products',
      icon: Package,
      link: '/admin/products',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: 'Order Management',
      description: 'View and manage orders',
      icon: ShoppingBag,
      link: '/admin/orders',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      link: '/admin/users',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      title: 'Analytics',
      description: 'View sales and performance metrics',
      icon: BarChart3,
      link: '/admin/analytics',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      icon: Settings,
      link: '/admin/settings',
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your e-commerce platform</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Menu */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Management Tools</h2>
          <p className="text-gray-600">Access different admin functions</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminMenuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={index}
                  to={item.link}
                  className={`${item.color} ${item.hoverColor} text-white p-6 rounded-lg transition-colors duration-200 transform hover:scale-105`}
                >
                  <div className="flex items-center mb-4">
                    <IconComponent className="h-8 w-8 mr-3" />
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm opacity-90">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4">
            <Link
              to="/admin/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Package className="h-5 w-5 mr-2" />
              Manage Products
            </Link>
            <Link
              to="/admin/orders"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              View Orders
            </Link>
            <Link
              to="/admin/users"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Users className="h-5 w-5 mr-2" />
              Manage Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
