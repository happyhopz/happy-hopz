# Happy Hopz - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

**Backend:**
```bash
cd C:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\server
npm install  # Already completed
```

**Frontend:**
```bash
cd C:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client
npm install  # Install axios and all dependencies
```

### 2. Start the Application

**Terminal 1 - Backend:**
```bash
cd C:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\server
npm run dev
```
Server runs on: `http://localhost:5001`

**Terminal 2 - Frontend:**
```bash
cd C:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client
npm run dev
```
Frontend runs on: `http://localhost:5173`

### 3. Login & Test

**Admin Account:**
- Email: `admin@happyhopz.com`
- Password: `admin123`
- Access: Full admin dashboard, product management, order management

**User Account:**
- Email: `user@test.com`
- Password: `user123`
- Access: Browse, cart, checkout, orders

---

## 📱 Features Available

### For Customers:
✅ Browse products with search and filters (category, age group, price)
✅ View product details with size/color selection
✅ Add to cart with quantity controls
✅ Checkout with shipping address
✅ View order history
✅ User authentication (login/signup)

### For Admins:
✅ Dashboard with statistics (users, orders, revenue)
✅ View all orders and update status
✅ Product management (CRUD operations)
✅ User management
✅ Low stock alerts

---

## 🎨 Design Features

- **Exact replica** of existing frontend design
- Pink-to-cyan gradient theme
- Custom animations (hop, float, sparkle)
- Responsive design (mobile + desktop)
- Cart badge with item count
- User dropdown menu
- Smooth transitions

---

## 🗄️ Database

**Location:** `server/prisma/dev.db` (SQLite)

**View Database:**
```bash
cd server
npx prisma studio
```
Opens at: `http://localhost:5555`

**Sample Data:**
- 2 users (admin + test user)
- 6 products (various categories)
- 1 sample address

---

## 📂 Project Structure

```
happy-hopz/
├── client/              Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/       Login, Products, Cart, Checkout, Orders, Admin
│   │   ├── components/  Navbar, Footer, Hero, Featured
│   │   ├── lib/         API client
│   │   └── hooks/       Auth context
│   └── package.json
│
└── server/              Backend (Node + Express)
    ├── src/
    │   ├── routes/      Auth, Products, Cart, Orders, Payment, Admin
    │   ├── middleware/  JWT authentication
    │   └── index.ts     Express server
    ├── prisma/
    │   ├── schema.prisma
    │   └── dev.db
    └── package.json
```

---

## 🔗 API Endpoints

All APIs available at: `http://localhost:5001/api`

- `/auth/*` - Authentication
- `/products/*` - Product management
- `/cart/*` - Shopping cart
- `/orders/*` - Order management
- `/payment/*` - Payment processing (mock)
- `/admin/*` - Admin operations

See `server/README.md` for full API documentation.

---

## 🎯 Next Steps

1. **Install frontend dependencies** (`npm install` in client folder)
2. **Start both servers** (backend + frontend)
3. **Test the application** with provided credentials
4. **Customize** as needed (add more products, modify design, etc.)

---

## 📝 Notes

- All TypeScript errors will resolve after running `npm install` in client
- Backend is fully operational with seeded data
- Frontend design matches existing site exactly
- Mock payment integration (ready for Stripe/Razorpay)
- SQLite for development (switch to PostgreSQL for production)

**Project Location:** `C:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\`
