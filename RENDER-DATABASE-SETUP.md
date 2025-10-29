# 🗄️ Render Database Setup Guide

This guide will help you set up your PostgreSQL database on Render and connect it to your application.

## 📋 Step 1: Create PostgreSQL Database on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New"** → **"PostgreSQL"**
3. **Configure Database**:
   - **Name**: `ecommerce-db` (or your preferred name)
   - **Database**: `ecommerce` (or your preferred name)
   - **User**: Auto-generated (you can change it)
   - **Region**: Choose closest to your web service
   - **PostgreSQL Version**: 15 (or latest)
   - **Plan**: Free (or paid if needed)

4. **Wait for Database Creation** (takes 2-5 minutes)

## 📋 Step 2: Get Database Connection Details

After database creation, you'll see:
- **Internal Database URL** (for services in same region)
- **External Database URL** (for services outside Render or local development)

**Copy the External Database URL** - it looks like:
```
postgres://username:password@dpg-xxxxx-a.oregon-postgres.render.com/ecommerce_xxxx
```

## 📋 Step 3: Configure Web Service Environment Variables

### Option A: Using DATABASE_URL (Recommended)

1. Go to your **Web Service** settings
2. Navigate to **Environment** tab
3. Add/Update these variables:

```bash
DATABASE_URL=postgres://username:password@dpg-xxxxx-a.oregon-postgres.render.com/ecommerce_xxxx
NODE_ENV=production
CLIENT_URL=https://your-app-name.onrender.com
JWT_SECRET=your_super_secure_random_string_here
PORT=5000
```

### Option B: Using Individual Variables (Alternative)

If DATABASE_URL doesn't work, parse it and set:

```bash
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=ecommerce_xxxx
DB_USER=username
DB_PASSWORD=password
NODE_ENV=production
CLIENT_URL=https://your-app-name.onrender.com
JWT_SECRET=your_super_secure_random_string_here
PORT=5000
```

## 📋 Step 4: Link Database to Web Service (Render Feature)

1. In your **Web Service** settings
2. Go to **Environment** tab
3. Scroll to **"Add Environment Variable from Database"**
4. Select your database
5. Choose **"DATABASE_URL"** or individual variables

## ✅ Step 5: Verify Connection

After deploying, check your **Web Service Logs** - you should see:
```
✅ PostgreSQL database connection established successfully
✅ Database tables already exist, skipping sync
```

## 🔧 Troubleshooting

### Error: ConnectionRefusedError

**Common Causes:**
1. ❌ Database not created or not running
2. ❌ Wrong DATABASE_URL or connection credentials
3. ❌ Database and Web Service in different regions
4. ❌ Missing SSL configuration

**Solutions:**
1. ✅ Verify database is **Active** in Render dashboard
2. ✅ Copy **External Database URL** (not internal)
3. ✅ Ensure DATABASE_URL includes SSL: `?ssl=true`
4. ✅ Check environment variables are set correctly
5. ✅ Verify database allows external connections

### Error: Authentication failed

**Solution:**
- ✅ Check username and password in DATABASE_URL
- ✅ Ensure no special characters need URL encoding
- ✅ Try resetting database password in Render

### Error: Database does not exist

**Solution:**
- ✅ Verify database name in connection string
- ✅ Check database exists in Render dashboard
- ✅ Ensure you're using the correct database

## 🧪 Test Connection Locally

1. **Get External Database URL** from Render
2. **Create `.env` file**:
```bash
DATABASE_URL=postgres://username:password@dpg-xxxxx-a.oregon-postgres.render.com/ecommerce_xxxx
NODE_ENV=production
```

3. **Test connection**:
```bash
npm run init-db
```

If successful, you'll see:
```
✅ PostgreSQL connection has been established successfully.
```

## 📊 Database Connection Priority

The application checks environment variables in this order:
1. **DATABASE_URL** (highest priority - recommended for Render)
2. **DATABASE_PUBLIC_URL** (Railway-specific)
3. **Individual variables**: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

## 🔐 Security Notes

- ✅ Never commit `.env` files to Git
- ✅ Use Render's environment variable system
- ✅ Database passwords are automatically encrypted in Render
- ✅ SSL is automatically enabled for production connections

## 🚀 Next Steps

After database connection is established:
1. ✅ Database tables will auto-create on first run
2. ✅ Initialize sample data: `npm run init-production-db` (via Render shell)
3. ✅ Test API endpoints: `/api/health`

## 📞 Need Help?

If connection issues persist:
1. Check Render dashboard → Services → Database → Logs
2. Verify database status is "Available"
3. Ensure web service and database are in same region
4. Check Render's documentation: https://render.com/docs/databases

