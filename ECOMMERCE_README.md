# fomkart E-commerce Platform

A comprehensive e-commerce platform built with Next.js 15, Supabase, and Stripe for buying and selling digital products and services.

## 🚀 Features Implemented

### Core E-commerce Functionality
- ✅ **Product Pages** - Individual product pages with package selection and buy options
- ✅ **Shopping Cart** - Add items, manage quantities, and review before checkout
- ✅ **Secure Checkout** - Integrated with Stripe for secure payment processing
- ✅ **Order Management** - Complete order tracking and status updates
- ✅ **Delivery Tracking** - Real-time order progress and delivery status
- ✅ **Messaging System** - Direct communication between buyers and sellers
- ✅ **Review System** - Rate and review completed orders
- ✅ **User Dashboard** - Manage purchases and sales in one place

### Database Schema
Comprehensive PostgreSQL schema with all necessary tables:
- Users, Products, Orders, Reviews
- Cart Items, Order Messages, Deliverables
- Payment tracking and order status management

### User Experience
- **Buyers** can browse, add to cart, checkout, and track orders
- **Sellers** can manage orders, communicate with buyers, and deliver work
- **Real-time updates** via messaging system
- **Mobile-responsive** design for all devices

## 📁 Project Structure

```
src/
├── app/
│   ├── product/[id]/        # Individual product pages
│   │   └── page.tsx         # Product details, packages, buy options
│   ├── cart/                # Shopping cart functionality
│   │   └── page.tsx         # Cart management and checkout prep
│   ├── checkout/            # Secure checkout process
│   │   └── page.tsx         # Payment processing and order creation
│   ├── orders/              # Order management
│   │   ├── page.tsx         # Orders list (buying/selling)
│   │   └── [id]/page.tsx    # Individual order tracking
│   └── category/[slug]/     # Category browsing
│       └── page.tsx         # Product listings by category
├── lib/
│   └── supabase.ts         # Database client and type definitions
├── database/
│   └── schema.sql          # Complete database schema
└── components/             # Reusable UI components
```

## 🛠 Technologies Used

- **Frontend**: Next.js 15.5.0, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Payments**: Stripe integration for secure transactions
- **Icons**: Lucide React icon library
- **Deployment**: Vercel-ready configuration

## 🚦 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account

### 2. Installation
```bash
# Clone and install dependencies
npm install

# Install e-commerce specific packages (already done)
npm install @supabase/supabase-js @stripe/stripe-js @types/uuid uuid
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Add your credentials:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### 4. Database Setup
```sql
-- Run the SQL schema in your Supabase dashboard
-- File: database/schema.sql
-- This creates all necessary tables and relationships
```

### 5. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

### 6. Cron Jobs (Auto-Approval)
To enable auto-approval of delivered orders after 3 days:
1. Set up a scheduler (like Vercel Cron or a custom script) to hit this endpoint periodically (e.g., hourly):
   `GET /api/cron/auto-approve`
2. This endpoint checks for `delivered` orders where the `approve_by` deadline has passed, marks them `completed`, releases funds, and notifies users.

## 🛒 E-commerce Workflow

### For Buyers:
1. **Browse Products** → Navigate categories or search
2. **View Product Details** → Select package, fill requirements
3. **Add to Cart** → Manage items and quantities
4. **Secure Checkout** → Enter billing info, complete payment
5. **Track Orders** → Monitor progress, communicate with sellers
6. **Leave Reviews** → Rate experience after delivery

### For Sellers:
1. **Receive Orders** → Get notified of new purchases
2. **Manage Orders** → Accept/decline, update status
3. **Communicate** → Message buyers directly
4. **Deliver Work** → Upload files, mark as delivered
5. **Get Paid** → Automatic payment processing

## 📊 Database Schema Overview

### Core Tables:
- **products** - Product catalog with images, pricing
- **product_packages** - Different service tiers per product
- **orders** - Order tracking with payment status
- **cart_items** - Shopping cart persistence
- **order_messages** - Buyer-seller communication
- **order_deliverables** - File uploads and deliveries
- **reviews** - Rating and feedback system

### Key Relationships:
- Orders link buyers, sellers, and products
- Messages enable real-time communication
- Deliverables track work completion
- Reviews provide quality feedback

## 🔒 Security Features

- **Authentication** - Supabase Auth integration
- **Row Level Security** - Database-level access control
- **Secure Payments** - Stripe handles sensitive data
- **Input Validation** - Form validation and sanitization
- **HTTPS Only** - Secure data transmission

## 🎨 UI/UX Features

- **Modern Design** - Clean, professional interface
- **Responsive Layout** - Works on all screen sizes
- **Loading States** - Smooth user experience
- **Error Handling** - Clear error messages
- **Accessibility** - Screen reader friendly
- **Fast Navigation** - Optimized routing

## 🚀 Deployment

### Vercel Deployment:
1. Connect GitHub repository
2. Add environment variables
3. Deploy with one click
4. Configure custom domain (optional)

### Environment Variables for Production:
```bash
# Update .env.example with production values
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_production_stripe_key
STRIPE_SECRET_KEY=your_production_stripe_secret
```

## 🔧 Customization Options

### Adding New Features:
- **Payment Methods** - Add PayPal, crypto payments
- **Shipping** - Physical product delivery
- **Subscriptions** - Recurring payment models
- **Analytics** - Sales tracking and reports
- **Marketing** - Discounts, coupons, promotions

### Styling:
- Tailwind CSS classes for quick styling
- Custom CSS components
- Dark mode support ready
- Brand color customization

## 📈 Performance Optimization

- **Next.js 15** - Latest performance improvements
- **Turbopack** - Fast development builds
- **Image Optimization** - Automatic image processing
- **Code Splitting** - Optimized bundle loading
- **Caching** - Supabase query caching

## 🆘 Troubleshooting

### Common Issues:
1. **Supabase Connection** - Check environment variables
2. **Stripe Payments** - Verify webhook configuration
3. **Image Upload** - Check Supabase storage policies
4. **Database Errors** - Verify schema and RLS policies

### Debug Mode:
```bash
# Enable debug logging
NEXT_PUBLIC_DEBUG=true npm run dev
```

## 📞 Support

For issues and questions:
1. Check this documentation
2. Review error logs in browser console
3. Verify database schema matches requirements
4. Test with sample data first

## 🎯 Next Steps

The e-commerce platform is fully functional! You can now:
- Create products and services
- Process payments securely
- Track orders and deliveries
- Manage customer relationships
- Scale your digital business

Ready to start selling? Set up your Supabase database, configure Stripe, and launch your marketplace!
