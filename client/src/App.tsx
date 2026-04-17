import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import AdminLayout from "./components/AdminLayout";
import WhatsAppButton from "./components/WhatsAppButton";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "./contexts/NotificationContext";
import MarketingPopup from "./components/MarketingPopup";
import ScrollToTop from "./components/ScrollToTop";
import usePageTracking from "./hooks/usePageTracking";
import { productsAPI, contentAPI } from "@/lib/api";

// Lazy-loaded pages — only downloaded when the user navigates to that route
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const SizeGuide = lazy(() => import("./pages/SizeGuide"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MyReturns = lazy(() => import("./pages/MyReturns"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminCMS = lazy(() => import("./pages/admin/CMS"));
const AdminContacts = lazy(() => import("./pages/admin/Contacts"));
const AdminMarketing = lazy(() => import("./pages/admin/Marketing"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const ReturnDetail = lazy(() => import("./pages/admin/ReturnDetail"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const VisitorInsights = lazy(() => import("./pages/admin/VisitorInsights"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,   // 10 minutes — don't refetch fresh data on every focus
      gcTime: 1000 * 60 * 30,      // 30 minutes — keep data in cache across page navigations
      refetchOnWindowFocus: false,  // avoid surprise refetches when user switches tabs
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

// ── Homepage Prefetch ──────────────────────────────────────────────────────────────────
// Fire all 3 homepage queries immediately when the JS bundle loads —
// BEFORE any route renders. By the time the 1.5s intro finishes, data is ready.
const PREFETCH_STALE = 1000 * 60 * 10; // 10 min — avoid re-fetching if already fresh

queryClient.prefetchQuery({
  queryKey: ['featured-products'],
  queryFn: () => productsAPI.getAll({ limit: 8 }).then(r => r.data),
  staleTime: PREFETCH_STALE,
});

queryClient.prefetchQuery({
  queryKey: ['homepage-layout'],
  queryFn: () => import('@/lib/api').then(m => m.contentAPI.get('homepage.layout')).then(r => r.data || []),
  staleTime: PREFETCH_STALE,
});

queryClient.prefetchQuery({
  queryKey: ['featured-content'],
  queryFn: () => import('@/lib/api').then(m => m.contentAPI.get('homepage.featured')).then(r => r.data),
  staleTime: PREFETCH_STALE,
});

// Minimal full-page spinner shown while a lazy chunk loads
const PageLoader = () => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{
      width: 40, height: 40, border: "4px solid #e5e7eb",
      borderTopColor: "#06b6d4", borderRadius: "50%",
      animation: "spin 0.7s linear infinite"
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Inner component so usePageTracking has access to BrowserRouter context
const AppInner = () => {
  usePageTracking();
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/my-returns" element={<MyReturns />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route element={<AdminLayout><Outlet /></AdminLayout>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/cms" element={<AdminCMS />} />
            <Route path="/admin/contacts" element={<AdminContacts />} />
            <Route path="/admin/marketing" element={<AdminMarketing />} />
            <Route path="/admin/returns" element={<AdminReturns />} />
            <Route path="/admin/returns/:id" element={<ReturnDetail />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/visitors" element={<VisitorInsights />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <MarketingPopup />
      <WhatsAppButton />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppInner />
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
