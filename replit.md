# Marjahan's Luxury Jewelry E-Commerce

## Overview
A luxury jewelry e-commerce website built with React, TypeScript, Express, and PostgreSQL. Features include product browsing, cart management, wishlist, and Stripe checkout integration.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack Query
- **Backend**: Express.js, Drizzle ORM, PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect)
- **Payments**: Stripe Checkout (requires STRIPE_SECRET_KEY)
- **Styling**: Shadcn/ui components with luxury gold theme

## Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── layout/     # Header, Footer
│   │   │   ├── products/   # ProductCard, ProductGrid
│   │   │   └── ui/         # Shadcn components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities, theme provider
│   │   └── pages/          # Page components
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Database operations
│   └── replit_integrations/auth/  # Replit Auth integration
├── shared/                 # Shared types and schemas
│   ├── schema.ts          # Drizzle schemas and Zod types
│   ├── routes.ts          # API contract definitions
│   └── models/auth.ts     # Auth-related schemas
```

## Features
- **Product Catalog**: Browse by category, search, filter by price/material
- **Shopping Cart**: Add/remove items, update quantities
- **Wishlist**: Save favorite products (requires login)
- **Stripe Checkout**: Secure payment processing
- **User Authentication**: Login with Replit Auth
- **Responsive Design**: Mobile-first luxury design
- **Dark Mode**: Toggle between light and dark themes

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `SESSION_SECRET`: Session encryption key (configured)
- `STRIPE_SECRET_KEY`: Stripe API key for payments (user must provide)

## API Endpoints
### Public
- `GET /api/categories` - List all categories
- `GET /api/products` - List products with filters
- `GET /api/products/:slug` - Get single product
- `GET /api/products/featured` - Featured products
- `GET /api/products/new-arrivals` - New arrivals
- `GET /api/products/search?q=query` - Search products

### Protected (requires authentication)
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add to cart
- `PATCH /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove from cart
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist
- `POST /api/checkout` - Create Stripe session
- `GET /api/orders` - List user orders

## Development
```bash
npm run dev        # Start development server
npm run db:push    # Push schema changes to database
npm run build      # Build for production
```

## User Preferences
- Theme: Light/Dark mode toggle available
- Luxury gold color scheme (#C9A55C)
- Playfair Display for headings, Inter for body text

## Notes
- Stripe integration requires user to provide STRIPE_SECRET_KEY
- Database is automatically seeded with sample jewelry products
- Authentication handled by Replit Auth - no custom login forms needed
