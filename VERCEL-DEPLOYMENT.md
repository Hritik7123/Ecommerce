# 🚀 Vercel Deployment Guide with Render PostgreSQL

## 📋 **Environment Variables for Vercel**

When deploying to Vercel, you need to set these environment variables in your Vercel dashboard:

### **Database Configuration**
```
DB_HOST=dpg-d40j9a3uibrs73csn3eg-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=main_db_nmwc
DB_USER=main_db_nmwc_user
DB_PASSWORD=uNeduuoZoEflNDKNaLZScn1iL1fEMCrF
```

### **JWT Secret**
```
JWT_SECRET=your_super_secure_jwt_secret_key_for_production_use_a_very_long_random_string_12345
```

### **Server Configuration**
```
NODE_ENV=production
PORT=5000
```

### **Frontend URL** (Update after deployment)
```
CLIENT_URL=https://your-app-name.vercel.app
```

### **Optional: Stripe Keys** (if you want payment processing)
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### **Optional: Email Configuration** (if you want email features)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🚀 **Deployment Steps**

### **1. Push to GitHub**
```bash
git add .
git commit -m "Configure for Vercel deployment with Render database"
git push origin master
```

### **2. Deploy to Vercel**

1. **Go to**: https://vercel.com
2. **Sign in** with GitHub
3. **Import your repository**
4. **Configure environment variables**:
   - Go to Project Settings → Environment Variables
   - Add all the variables listed above
5. **Deploy**

### **3. Update CLIENT_URL**
After deployment, update the `CLIENT_URL` environment variable in Vercel with your actual domain:
```
CLIENT_URL=https://your-actual-domain.vercel.app
```

---

## ✅ **Test Accounts**

After deployment, you can test with these accounts:

- **Admin Account**: 
  - Email: `admin@ecommerce.com`
  - Password: `admin123`

- **Regular User Account**:
  - Email: `john@example.com` 
  - Password: `password123`

---

## 🔧 **Troubleshooting**

### **Database Connection Issues**
- Verify all environment variables are set correctly in Vercel
- Check that your Render database is running
- Ensure SSL is enabled (already configured in the code)

### **CORS Issues**
- Make sure `CLIENT_URL` matches your Vercel domain exactly
- Check browser console for CORS errors

### **Authentication Issues**
- Verify `JWT_SECRET` is set and is a long, random string
- Check that user accounts exist in the database

---

## 📊 **Database Status**

✅ **Database Connected**: Your Render PostgreSQL database is connected  
✅ **Tables Created**: All necessary tables are created  
✅ **Sample Data**: Test users and products are available  
✅ **SSL Configured**: Database connection uses SSL for security  

---

## 🎯 **Next Steps**

1. **Deploy to Vercel** using the steps above
2. **Test the application** with the provided test accounts
3. **Update environment variables** with your actual domain
4. **Customize** the application as needed

Your e-commerce application is now ready for production deployment! 🎉
