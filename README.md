# 🛒 E-Commerce Platform

A full-stack e-commerce application built with React, Node.js, Express, and PostgreSQL. Features include user authentication, product management, shopping cart, order processing, and order tracking.

## ✨ Features

### 🛍️ **Core E-Commerce Features**
- **Product Catalog**: Browse and search products with filtering
- **Shopping Cart**: Add/remove items, quantity management
- **User Authentication**: Registration, login, profile management
- **Order Processing**: Complete checkout flow with order confirmation
- **Order History**: View past orders with detailed information
- **Order Tracking**: Public order tracking by order number
- **Admin Dashboard**: Manage products, orders, and users

### 🎯 **Advanced Features**
- **Order Status Timeline**: Real-time order status updates
- **Order Cancellation**: Cancel orders before processing
- **Return Requests**: Request returns for delivered orders
- **Product Reviews**: Rate and review products
- **Search & Filter**: Advanced product search and filtering
- **Responsive Design**: Mobile-friendly interface
- **Payment Integration**: Stripe payment processing (ready for integration)

## 🚀 **Tech Stack**

### **Frontend**
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **React Query** for data fetching
- **React Hook Form** for form handling

### **Backend**
- **Node.js** with Express.js
- **PostgreSQL** database with Sequelize ORM
- **JWT** for authentication
- **Multer** for file uploads
- **Express Validator** for input validation
- **Helmet** for security
- **CORS** for cross-origin requests

### **Database**
- **PostgreSQL** with Sequelize ORM
- **User Management**: Authentication, profiles, roles
- **Product Management**: Categories, inventory, reviews
- **Order Management**: Orders, order items, status tracking
- **Cart Management**: Shopping cart functionality

## 📦 **Installation & Setup**

### **Prerequisites**
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### **1. Clone the Repository**
```bash
git clone https://github.com/Hritik7123/Ecommerce.git
cd Ecommerce
```

### **2. Install Dependencies**
```bash
# Install all dependencies (root + client)
npm run install-all
```

### **3. Environment Configuration**
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Stripe Keys (for payment processing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### **4. Database Setup**
```bash
# Initialize database with sample data
npm run init-db
```

### **5. Start Development Server**
```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run server  # Backend only (port 5000)
npm run client  # Frontend only (port 3000)
```

## 🌐 **Access Points**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 📱 **Application Structure**

```
ecommerce/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/         # Express middleware
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── scripts/           # Database scripts
│   └── uploads/           # File uploads
├── package.json
└── README.md
```

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### **Products**
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### **Orders**
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/track/:orderNumber` - Track order (public)
- `PUT /api/orders/:id/cancel` - Cancel order
- `PUT /api/orders/:id/return` - Request return

### **Cart**
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:productId` - Remove item

## 🎨 **Key Features Explained**

### **Order History & Tracking**
- **Order Timeline**: Visual timeline showing order status changes
- **Status Updates**: Real-time status updates with timestamps
- **Public Tracking**: Track orders without login using order number
- **Order Management**: Cancel orders, request returns

### **Admin Dashboard**
- **Product Management**: Add, edit, delete products
- **Order Management**: View and update order status
- **User Management**: Manage user accounts
- **Analytics**: Order statistics and insights

### **Security Features**
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS for security
- **Helmet Security**: Security headers with Helmet

## 🚀 **Deployment**

### **Production Environment Variables**
```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-domain.com
```

### **Build for Production**
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 📊 **Database Schema**

### **Users Table**
- User authentication and profile information
- Role-based access control (user/admin)

### **Products Table**
- Product information, pricing, inventory
- Image management and categorization

### **Orders Table**
- Order details with status tracking
- Timeline for order status changes
- Payment and shipping information

### **Cart Table**
- Shopping cart functionality
- User-specific cart management

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **Author**

**Hritik7123**
- GitHub: [@Hritik7123](https://github.com/Hritik7123)
- Repository: [Ecommerce](https://github.com/Hritik7123/Ecommerce)

## 🙏 **Acknowledgments**

- React team for the amazing framework
- Express.js for the robust backend
- PostgreSQL for reliable database
- All open-source contributors

---

**⭐ Star this repository if you found it helpful!**