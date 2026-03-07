import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import WhatsAppButton from "./components/WhatsAppButton";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "./contexts/NotificationContext";
import MarketingPopup from "./components/MarketingPopup";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import Login from "./pages/Login";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import SizeGuide from "./pages/SizeGuide";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import VerifyEmail from './pages/VerifyEmail';
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminUsers from "./pages/admin/Users";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import AdminCoupons from "./pages/admin/Coupons";
import AdminReviews from "./pages/admin/Reviews";
import AdminCMS from "./pages/admin/CMS";
import AdminContacts from "./pages/admin/Contacts";
import AdminMarketing from "./pages/admin/Marketing";
import AdminSettings from "./pages/admin/Settings";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MyReturns from './pages/MyReturns';
import AdminReturns from './pages/admin/AdminReturns';
import ReturnDetail from './pages/admin/ReturnDetail';
import AdminNotifications from './pages/admin/Notifications';
import VisitorInsights from './pages/admin/VisitorInsights';
import TrackOrder from "./pages/TrackOrder";
import NotFound from "./pages/NotFound";
import usePageTracking from "./hooks/usePageTracking";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,                  // always treat data as stale — refetch in background immediately
      refetchOnWindowFocus: true,    // refetch the moment user switches back to the tab
      refetchOnReconnect: true,      // refetch after losing internet
      retry: 1,
    },
  },
});

// Inner component so usePageTracking has access to BrowserRouter context
const AppInner = () => {
  usePageTracking();
  return (
    <>
      <ScrollToTop />
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
