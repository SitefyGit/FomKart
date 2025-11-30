# FomKart Supabase Setup Guide

## 🎯 Quick Setup Checklist

Your Supabase project is ready! Follow these steps to complete the setup:

**Project ID**: `upmbvugogybdutqoqern`  
**Project URL**: `https://upmbvugogybdutqoqern.supabase.co`

---

## 📋 Step-by-Step Setup

### 1. Database Setup (SQL)

1. Go to your Supabase dashboard: https://app.supabase.com/project/upmbvugogybdutqoqern
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `database/supabase-setup.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the setup

✅ **This will create**:
- All 12 required tables (users, products, orders, etc.)
- Row Level Security policies
- Indexes for performance
- Sample categories
- All triggers and functions

### 2. Get Your API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy your **anon public** key
3. Copy your **service role** key (for server-side operations)

### 3. Environment Configuration

1. Copy `supabase-env-config.env` to `.env.local` in your project root:
   ```bash
   cp supabase-env-config.env .env.local
   ```

2. Update `.env.local` with your actual keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://upmbvugogybdutqoqern.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

### 4. Create Sample Creator Account

1. Go to your Supabase dashboard: **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - **Email**: `creator@fomkart.com`
   - **Password**: *(set a secure temporary value; do not store it in git)*
   - **Confirm**: Enable email confirmation
4. Click **Create user**
5. Copy the **User UID** from the users table
6. Open `database/sample-creator-data.sql`
7. Replace all `YOUR_USER_ID_HERE` with the actual User UID
8. Run the SQL in your **SQL Editor**

### 5. Test Your Setup

Run your development server:
```bash
npm run dev
```

Visit these URLs to test:
- http://localhost:3001 - Main landing page
- http://localhost:3001/auth/signup - Create new account
- http://localhost:3001/auth/login - User login
- http://localhost:3001/auth/creator-login - Creator login (use the credentials you configured)
- http://localhost:3001/creator/designpro - Creator profile page

---

## 🔧 Database Schema Overview

Your FomKart database includes:

### Core E-commerce Tables
- **users** - User profiles and creator information
- **categories** - Product/service categories
- **products** - Product/service listings
- **product_packages** - Pricing tiers (Basic, Standard, Premium)
- **orders** - Order tracking and management
- **order_messages** - Buyer-seller communication
- **order_deliverables** - File uploads and delivery
- **reviews** - Rating and feedback system
- **carts** - Shopping cart functionality

### Lead Capture & Growth
- **newsletter_subscriptions** - Email list building
- **subscriptions** - Creator following system
- **notifications** - User notifications

### Sample Data Included
- 8 product categories (Digital Marketing, Design, Programming, etc.)
- Demo user structure for testing

---

## 🛡️ Security Features Enabled

### Row Level Security (RLS)
- Users can only see/edit their own data
- Public data (products, reviews) is accessible to all
- Order participants can communicate securely
- Newsletter subscriptions are creator-specific

### Authentication Ready
- Supabase Auth integration
- Social login support (Google, Facebook)
- Password reset functionality
- Email verification

---

## 🧪 Test Your Setup

### 1. Database Connection Test
```javascript
// Test in browser console at localhost:3000
import { supabase } from './lib/supabase'
const { data, error } = await supabase.from('categories').select('*')
console.log('Categories:', data)
```

### 2. Creator Login Test
1. Go to `/auth/creator-login`
2. Use demo credentials you configured:
   - **Email**: creator@fomkart.com
   - **Password**: *(the secure value you set in Supabase Auth)*
3. Should redirect to creator profile

### 3. Newsletter Signup Test
1. Scroll to newsletter form on any page
2. Enter test email
3. Check `newsletter_subscriptions` table in Supabase

---

## 📊 Next Steps

### Immediate Actions
1. ✅ Run the SQL setup
2. ✅ Configure environment variables
3. ✅ Test database connection
4. ✅ Create your first user account

### Development Phase
1. **Customize Categories**: Update the sample categories for your niche
2. **Add Products**: Create your first products/services
3. **Setup Stripe**: Configure payment processing
4. **Test Workflows**: Complete order flow testing
5. **Email Integration**: Connect newsletter service (Mailchimp/ConvertKit)

### Production Deployment
1. **Environment Variables**: Set production Supabase keys
2. **Stripe Live Keys**: Switch to live payment processing
3. **Domain Setup**: Configure custom domain
4. **Monitoring**: Set up error tracking and analytics

---

## 🆘 Troubleshooting

### Common Issues

**"relation does not exist" error**
- Ensure you ran the complete SQL setup
- Check that all tables were created in the `public` schema

**"permission denied" error**
- Verify RLS policies are correctly applied
- Check that you're authenticated when accessing protected data

**"invalid API key" error**
- Double-check your `.env.local` file
- Ensure you copied the correct anon key from Supabase settings

**Connection refused**
- Verify your project URL is correct
- Check that your Supabase project is not paused

### Debug Commands

Test database connection:
```bash
# In your project terminal
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('categories').select('count').then(console.log);
"
```

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Integration**: https://stripe.com/docs
- **Project Dashboard**: https://app.supabase.com/project/upmbvugogybdutqoqern

---

## 🎉 You're All Set!

Your FomKart platform now has:
- ✅ Complete e-commerce database
- ✅ User authentication system
- ✅ Creator profile functionality
- ✅ Order management system
- ✅ Lead capture forms
- ✅ Newsletter system
- ✅ Review and rating system
- ✅ Shopping cart functionality

Ready to start building your marketplace! 🚀
