# Happy Hopz Backend - Setup Instructions

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Initialize Database
```bash
# Generate Prisma Client
npx prisma generate

# Create database and run migrations
npx prisma db push

# Seed sample data
npm run seed
```

### 3. Start Server
```bash
npm run dev
```

Server will run on: `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:id` - Update quantity
- `DELETE /api/cart/:id` - Remove item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update status (admin)

### Payment
- `POST /api/payment/intent` - Create payment intent
- `POST /api/payment/confirm` - Confirm payment

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/orders` - List all orders

## Test Credentials

**Admin:**
- Email: `admin@happyhopz.com`
- Password: `admin123`

**User:**
- Email: `user@test.com`
- Password: `user123`

## Database

Using SQLite for development (`dev.db` file).
To view database: `npx prisma studio`
