# FomKart Troubleshooting Guide

## Current Issues and Solutions

### 1. Newsletter Dashboard "Failed to fetch subscribers" Error

**Problem**: Newsletter dashboard shows "Failed to fetch subscribers" error.

**Causes**:
- Database schema not yet set up
- No creator ID being passed to the component
- Creator account doesn't exist in database

**Solutions**:

#### A. Ensure Database Setup is Complete
1. Go to your Supabase dashboard: https://app.supabase.com/project/upmbvugogybdutqoqern
2. Click **SQL Editor** → **New Query**
3. Run `database/supabase-setup.sql` (if not done already)
4. Check that all tables exist in **Table Editor**

#### B. Create Sample Creator Account
1. **Authentication** → **Users** → **Add user**
2. Create user with:
  - Email: `creator@fomkart.com`
   - Password: `creator123`
3. Copy the User UID
4. Replace `YOUR_USER_ID_HERE` in `database/sample-creator-data.sql`
5. Run the sample data SQL

#### C. Test the API Endpoint
Open browser console and test:
```javascript
fetch('/api/newsletter?creatorId=YOUR_ACTUAL_USER_ID')
  .then(r => r.json())
  .then(console.log)
```

### 2. 404 Error on Creator Signup Page

**Problem**: `/auth/creator-signup` returns 404

**Solution**: ✅ **FIXED** - Created the creator signup page at:
- `src/app/auth/creator-signup/page.tsx`

### 3. Authentication Issues

**Current Status**: Real Supabase authentication is now enabled

**Test URLs**:
- Regular signup: http://localhost:3001/auth/signup
- Creator signup: http://localhost:3001/auth/creator-signup  
- Regular login: http://localhost:3001/auth/login
- Creator login: http://localhost:3001/auth/creator-login

### 4. Quick Fix for Newsletter Dashboard

If you want to test without setting up the full database, temporarily disable the error by adding this to the component:

```jsx
// In NewsletterDashboard.tsx, add this condition at the top
if (!creatorId || creatorId === 'demo') {
  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-blue-800">
        <strong>Setup Required:</strong> Please complete the database setup and create a creator account to view subscriber data.
      </p>
    </div>
  )
}
```

## ✅ Fixes Applied

1. **Created Creator Signup Page** - Users can now register as creators
2. **Enhanced Error Handling** - Newsletter dashboard shows better error messages
3. **Real Authentication** - All pages now use Supabase authentication
4. **Database Integration** - Orders, products, and users are stored in Supabase

## 🚀 Next Steps

1. **Complete Database Setup**:
   ```sql
   -- Run in Supabase SQL Editor
   -- 1. database/supabase-setup.sql
   -- 2. database/sample-creator-data.sql (with your user ID)
   ```

2. **Test Creator Flow**:
   - Sign up as creator: `/auth/creator-signup`
   - Login as creator: `/auth/creator-login`
   - View creator profile: `/creator/[username]`

3. **Test E-commerce Flow**:
   - Browse products: `/`
   - Add to cart and checkout
   - View orders: `/orders`

## 🆘 Still Having Issues?

1. Check browser console for errors
2. Verify `.env.local` has correct Supabase keys
3. Ensure all database tables exist in Supabase
4. Test API endpoints manually in browser dev tools

## 📞 Quick Debug Commands

```bash
# Check if server is running
curl http://localhost:3001/api/newsletter?creatorId=test

# Check database connection
# (Replace with your actual Supabase URL and key)
```
