# Happy Hopz — Kids Footwear E-Commerce Platform

> **Where Every Step Is a Happy Hopz** 🐼

A production-grade, full-stack e-commerce platform purpose-built for a kids footwear brand. Features a React storefront, Node.js API server, PostgreSQL database (via Supabase), Razorpay payments, and a comprehensive admin dashboard.

**Live:** [happyhopz.com](https://www.happyhopz.com)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui (Radix) |
| **State & Data** | TanStack React Query · Axios · React Hook Form · Zod |
| **Animations** | Framer Motion · Custom CSS keyframes |
| **Backend** | Node.js · Express · TypeScript |
| **Database** | PostgreSQL (Supabase) · Prisma ORM |
| **Auth** | JWT · bcrypt · Google OAuth |
| **Payments** | Razorpay |
| **Email** | Nodemailer · SendGrid |
| **Deployment** | Vercel (frontend) · Render (API) · Supabase (DB) |

---

## Features

### Storefront
- 🛍️ Product catalog with filtering, search, and size guide
- 🛒 Persistent shopping cart with size/color variants
- 💳 Razorpay checkout with coupon support
- 📦 Order tracking & status history
- ↩️ Return & exchange request flow
- ⭐ Product reviews & ratings
- 🔔 In-app notifications
- 🔐 Email/password & Google OAuth sign-in
- 📧 Email verification & password reset
- 👤 User settings, addresses, & order history
- 🎨 Custom animations (hop, float, sparkle) & responsive design

### Admin Dashboard
- 📊 Revenue dashboard with analytics charts
- 📦 Product CRUD with drag-and-drop reorder, image upload, SKU & inventory management
- 🧾 Order management with status updates, shipping labels, & email/WhatsApp notifications
- 👥 User management & contact form inbox
- 🎟️ Coupon engine (percentage/flat, first-time-only, usage limits)
- ↩️ Return/exchange processing
- ⭐ Review moderation (approve/feature)
- 📰 CMS for site content
- 📢 Marketing popups & newsletter subscribers
- 📈 Visitor insights — daily trends, conversion funnel, device/browser breakdown, traffic sources, geo distribution
- ⚙️ Site settings — maintenance mode, notification preferences
- 🔒 Role-based access (USER / ADMIN)
- 📥 Inventory export to Excel

---

## Project Structure

```
happy-hopz/
├── client/                      React frontend (Vite + TypeScript + Tailwind)
│   └── src/
│       ├── components/          Reusable UI — Navbar, Footer, Hero, Reviews, Admin layout …
│       │   ├── admin/           Admin-specific components
│       │   └── ui/              shadcn/ui primitives (Button, Dialog, Tabs, Toast …)
│       ├── pages/               Route pages — Products, Cart, Checkout, Orders …
│       │   └── admin/           Admin pages — Dashboard, Products, Orders, Settings …
│       ├── contexts/            Auth context provider
│       ├── hooks/               Custom hooks
│       ├── lib/                 API client & utilities
│       └── test/                Vitest unit tests
│
├── server/                      Express API server (TypeScript)
│   ├── prisma/
│   │   └── schema.prisma        Database schema (18 models)
│   └── src/
│       ├── routes/              19 route modules (auth, products, orders, admin …)
│       ├── middleware/           Auth, rate-limiting, maintenance mode
│       ├── services/            Notification service (email + WhatsApp)
│       ├── lib/                 Prisma client singleton
│       └── utils/               Helpers
│
├── vercel.json                  Frontend deployment + API proxy rewrites
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** (or yarn/pnpm)
- **PostgreSQL** database (or a free [Supabase](https://supabase.com) project)

### 1. Clone & Install

```bash
git clone https://github.com/<your-org>/happy-hopz.git
cd happy-hopz

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment

Create `server/.env`:

```env
# Database
SUPABASE_DATABASE_URL=postgresql://…

# Auth
JWT_SECRET=your-jwt-secret

# Razorpay
RAZORPAY_KEY_ID=rzp_…
RAZORPAY_KEY_SECRET=…

# Email (pick one)
SENDGRID_API_KEY=…
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=…
SMTP_PASS=…

# Google OAuth
GOOGLE_CLIENT_ID=…

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### 3. Set Up Database

```bash
cd server
npx prisma generate
npx prisma db push        # Create tables
npm run seed              # (Optional) Seed sample data
```

### 4. Run Development Servers

```bash
# Terminal 1 — API server (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client
npm run dev
```

### 5. Explore the Database

```bash
cd server
npx prisma studio         # Opens visual DB browser at http://localhost:5555
```

---

## API Reference

All endpoints are prefixed with `/api`. Auth-protected routes require a `Bearer` token.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Create account |
| `POST` | `/auth/login` | Login (JWT) |
| `POST` | `/auth/google` | Google OAuth login |
| `GET` | `/auth/me` | Current user profile |
| `POST` | `/auth/forgot-password` | Send reset email |
| `POST` | `/auth/reset-password` | Reset password |
| `POST` | `/auth/verify-email` | Verify email code |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/products` | List products (public) |
| `GET` | `/products/:id` | Product detail (public) |
| `POST` | `/products` | Create product (admin) |
| `PUT` | `/products/:id` | Update product (admin) |
| `DELETE` | `/products/:id` | Delete product (admin) |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cart` | Get user cart |
| `POST` | `/cart` | Add to cart |
| `PUT` | `/cart/:id` | Update quantity |
| `DELETE` | `/cart/:id` | Remove item |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Place order |
| `GET` | `/orders` | User's orders |
| `GET` | `/orders/:id` | Order detail |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payment/create-order` | Create Razorpay order |
| `POST` | `/payment/verify` | Verify payment signature |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reviews/:productId` | Product reviews |
| `POST` | `/reviews` | Submit review |

### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/coupons/validate` | Validate coupon code |

### Returns
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/returns` | Submit return request |
| `GET` | `/returns` | User's returns |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/stats` | Dashboard analytics |
| `GET` | `/admin/users` | All users |
| `GET` | `/admin/orders` | All orders |
| `PUT` | `/admin/orders/:id/status` | Update order status |
| `GET` | `/admin/visitors` | Visitor insights |
| `GET` | `/admin/returns` | All return requests |
| `PUT` | `/admin/returns/:id` | Process return |

*Additional endpoints:* `/search`, `/addresses`, `/contacts`, `/notifications`, `/marketing`, `/settings`, `/analytics`, `/content`

---

## Database Schema

18 Prisma models powering the platform:

| Model | Purpose |
|-------|---------|
| `User` | Accounts, roles, preferences |
| `Product` | Catalog with variants, pricing, SEO |
| `CartItem` | Per-user cart (unique by product + size + color) |
| `Order` | Orders with status history & coupon tracking |
| `OrderItem` | Line items per order |
| `Address` | Saved shipping addresses |
| `Coupon` | Discount codes with usage rules |
| `CouponUsage` / `CouponReservation` | Usage tracking & reservation locks |
| `Review` | Product ratings & moderation |
| `ReturnRequest` / `ReturnItem` | Return & exchange workflow |
| `Notification` / `NotificationLog` | In-app & email/WhatsApp notifications |
| `PageView` / `AnalyticsEvent` | Visitor analytics & event tracking |
| `SiteSettings` / `SiteContent` | Dynamic config & CMS |
| `ContactForm` | Customer inquiries |
| `FlashSale` | Time-limited promotions |
| `NewsletterSubscriber` | Email list management |
| `MarketingPopup` | Promotional popups |
| `AuditLog` | Admin action history |

---

## Deployment

| Service | Role | URL |
|---------|------|-----|
| **Vercel** | Frontend hosting + API proxy | `happy-hopz.vercel.app` |
| **Render** | API server | `happy-hopz.onrender.com` |
| **Supabase** | PostgreSQL database | — |

### Deploy Frontend (Vercel)
```bash
cd client
npm run build
# Push to GitHub → Vercel auto-deploys
```

### Deploy Backend (Render)
```bash
cd server
npm run build:migrate
npm start
```

The `vercel.json` proxies `/api/*` requests to the Render backend.

---

## Design System

| Element | Details |
|---------|---------|
| **Colors** | Pink-to-cyan gradient theme with warm accents |
| **Typography** | Nunito (body) · Fredoka (headings) · Playfair Display (brand) |
| **Components** | shadcn/ui (Radix primitives) + custom components |
| **Animations** | Framer Motion transitions · CSS keyframes (hop, float, sparkle) |
| **Icons** | Lucide React |

---

## Scripts Reference

### Client (`client/`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run test` | Run Vitest tests |
| `npm run lint` | ESLint check |

### Server (`server/`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot-reload (tsx) |
| `npm run build` | Generate Prisma + compile TS |
| `npm run build:migrate` | Build + push schema to DB |
| `npm start` | Run migrations + start production |
| `npm run seed` | Seed sample data |
| `npx prisma studio` | Visual database browser |

---

## License

MIT

---

<p align="center">Made with ❤️ for tiny feet everywhere</p>
