# Deployment Guide for Vercel

## Issues Fixed

The login failure on Vercel was caused by:
1. **Missing Backend API**: Only the frontend was deployed, not the backend
2. **Incorrect API URLs**: Frontend was trying to connect to localhost in production
3. **Missing Environment Variables**: Database and JWT secrets not configured

## Deployment Steps

### 1. Environment Variables Setup

In your Vercel dashboard, add these environment variables:

```bash
# Database Configuration
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=your_production_db_name
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password

# JWT Secret (Generate a strong secret)
JWT_SECRET=your_super_secure_jwt_secret_key_for_production_use_a_very_long_random_string

# Stripe Keys (Optional - for payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Configuration
NODE_ENV=production
CLIENT_URL=https://your-project-name.vercel.app
```

### 2. Database Setup

You need a production PostgreSQL database. Recommended options:

**Option A: Neon (Free tier available)**
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Update environment variables in Vercel

**Option B: Supabase (Free tier available)**
1. Go to https://supabase.com
2. Create a new project
3. Get connection details from Settings > Database
4. Update environment variables in Vercel

**Option C: Railway**
1. Go to https://railway.app
2. Create a new PostgreSQL database
3. Get connection details
4. Update environment variables in Vercel

### 3. Initialize Database

After setting up the database, you need to run the initialization script:

1. **Option A: Use Vercel CLI**
   ```bash
   npm install -g vercel
   vercel env pull .env.local
   npm run init-db
   ```

2. **Option B: Connect to your database directly**
   - Use a database client (pgAdmin, DBeaver, etc.)
   - Run the SQL commands from the models

### 4. Deploy to Vercel

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically deploy both frontend and backend

### 5. Test the Deployment

1. Visit your Vercel URL
2. Try logging in with:
   - Admin: `admin@ecommerce.com` / `admin123`
   - User: `john@example.com` / `password123`

## File Changes Made

1. **vercel.json**: Updated to deploy both frontend and backend
2. **api/index.js**: Created serverless function for Vercel
3. **client/src/services/api.ts**: Fixed API URL for production
4. **package.json**: Added proper build scripts

## Troubleshooting

If login still fails:

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard > Functions tab
   - Check for any errors in the API function

2. **Verify Environment Variables**:
   - Ensure all required variables are set
   - Check that database connection is working

3. **Test Database Connection**:
   - Use a database client to verify connection
   - Ensure tables are created properly

4. **Check CORS Settings**:
   - Verify CLIENT_URL matches your Vercel domain
   - Check browser console for CORS errors

## Production Database Setup

After setting up your production database, you need to initialize it:

```bash
# If using Vercel CLI
vercel env pull .env.local
npm run init-db

# Or manually run the initialization script
node server/scripts/init-db.js
```

This will create the necessary tables and sample data.
