# Happy Hopz - Full-Stack E-Commerce System

> **Kids Footwear Brand** - Where Every Step Is a Happy Hopz 🐼

A complete, production-ready e-commerce platform with React frontend, Node.js backend, and SQLite database.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### 1. Start Backend
```bash
cd server
npm install
npm run dev
```
Backend runs on: `http://localhost:5001`

### 2. Start Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

### 3. Test Credentials
**Admin:** `admin@happyhopz.com` / `admin123`
**User:** `user@test.com` / `user123`

---

## 📁 Project Structure

```
happy-hopz/
├── client/          React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/    UI components
│   │   ├── pages/         Page components
│   │   ├── lib/           API client
│   │   └── hooks/         Auth context
│   └── package.json
│
└── server/          Node + Express + Prisma + SQLite
    ├── src/
    │   ├── routes/        API endpoints
    │   ├── middleware/    Auth & validation
    │   └── prisma/        Database schema
    └── package.json
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create (admin)
- `PUT /api/products/:id` - Update (admin)
- `DELETE /api/products/:id` - Delete (admin)

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add item
- `PUT /api/cart/:id` - Update quantity
- `DELETE /api/cart/:id` - Remove item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order
- `PUT /api/orders/:id/status` - Update status (admin)

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - List users
- `GET /api/admin/orders` - List all orders

---

## 🎨 Design System

**Colors:** Pink-to-cyan gradient theme
**Fonts:** Nunito (body), Fredoka (headings), Playfair Display (brand)
**Animations:** Custom keyframes (hop, float, sparkle, etc.)

---

## 🗄️ Database

Using **SQLite** for development (file: `server/prisma/dev.db`)

To view database:
```bash
cd server
npx prisma studio
```

---

## 📦 Features

✅ JWT Authentication
✅ Role-based access (USER/ADMIN)
✅ Product management
✅ Shopping cart
✅ Order processing
✅ Mock payment integration
✅ Admin dashboard APIs
✅ Responsive design
✅ Custom animations

---

## 🔨 Next Steps

The backend is **fully functional**. To complete the system:

1. Create product listing and detail pages
2. Build cart and checkout UI
3. Add order history page
4. Create admin dashboard
5. Connect all frontend components to APIs

See `walkthrough.md` for detailed implementation guide.

---

## 📝 Documentation

- **Backend README:** `server/README.md`
- **Walkthrough:** `walkthrough.md` (in artifacts)
- **Implementation Plan:** `implementation_plan.md` (in artifacts)

---

## 🌐 Deployment

**Backend:** Deploy to Heroku, Railway, or Render
**Frontend:** Deploy to Vercel or Netlify
**Database:** Switch to PostgreSQL for production

---

## 📧 Support

For questions or issues, refer to the walkthrough document or implementation plan.

**Project Location:** `C:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\`
