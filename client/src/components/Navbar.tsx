import { ShoppingCart, User, Menu, X, ChevronDown, ShoppingBag, Bell, Heart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { cartAPI } from '@/lib/api';
import { useNotifications } from '@/contexts/NotificationContext';
import pandaLogo from '@/assets/happy-hopz-logo.png';
import { format } from 'date-fns';
import OmniSearch from './OmniSearch';

const menuItems = [
  {
    label: 'New Arrivals',
    href: '/products?search=new',
    dropdown: [
      { label: 'Latest Sneakers', href: '/products?category=Sneakers' },
      { label: 'New Sandals', href: '/products?category=Sandals' },
      { label: 'Fresh Styles', href: '/products' },
      { label: 'Just Dropped', href: '/products' }
    ],
  },
  {
    label: 'Boys',
    href: '/products?search=Boys',
    dropdown: [
      { label: 'Sneakers', href: '/products?category=Sneakers&search=Boys' },
      { label: 'Sandals', href: '/products?category=Sandals&search=Boys' },
      { label: 'School Shoes', href: '/products?category=School&search=Boys' },
      { label: 'Party Wear', href: '/products?category=Party Wear&search=Boys' },
      { label: 'Sports Shoes', href: '/products?category=Sports Shoes&search=Boys' }
    ],
  },
  {
    label: 'Girls',
    href: '/products?search=Girls',
    dropdown: [
      { label: 'Sneakers', href: '/products?category=Sneakers&search=Girls' },
      { label: 'Sandals', href: '/products?category=Sandals&search=Girls' },
      { label: 'School Shoes', href: '/products?category=School&search=Girls' },
      { label: 'Party Wear', href: '/products?category=Party Wear&search=Girls' },
      { label: 'Ballet Flats', href: '/products?category=Ballet&search=Girls' }
    ],
  },
  {
    label: 'Trending',
    href: '/products',
    dropdown: [
      { label: 'Top Picks', href: '/products?search=Trending' },
      { label: 'Best Sellers', href: '/products?search=Best Seller' },
      { label: 'Customer Favorites', href: '/products?search=Favourite' },
      { label: 'Hampers', href: '/products?search=Hampers' }
    ],
  },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const { data: cartItems } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) {
        const localCart = localStorage.getItem('cart');
        return localCart ? JSON.parse(localCart) : [];
      }
      const response = await cartAPI.get();
      return response.data;
    },
    enabled: true // Always enabled to support guest cart count
  });

  const cartCount = cartItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  return (
    <nav className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* LEFT: Logo + Stacked Brand Name */}
          <a href="/" className="flex items-center gap-1 group flex-shrink-0">
            <img
              src={pandaLogo}
              alt="Happy Hopz"
              className="w-12 h-12 lg:w-[72px] lg:h-[72px] object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col leading-none">
              <span className="text-base lg:text-lg font-playfair font-bold text-foreground tracking-widest">
                HAPPY
              </span>
              <span className="text-base lg:text-lg font-playfair font-bold text-foreground tracking-widest">
                HOPZ
              </span>
            </div>
          </a>

          {/* CENTER: Desktop Navigation with Dropdowns */}
          <div className="hidden lg:flex items-center justify-center flex-1 gap-0 mx-8">
            {menuItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={item.href}
                  className="flex items-center gap-1 px-4 py-5 font-playfair font-medium text-sm tracking-wide transition-colors text-foreground hover:text-primary relative"
                >
                  {item.label}
                  {activeDropdown === item.label && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-foreground rounded-full" />
                  )}
                </Link>

                {/* Individual dropdown positioned directly below each item */}
                {activeDropdown === item.label && item.dropdown.length > 0 && (
                  <div
                    className="absolute left-0 top-full pt-0 z-50"
                    onMouseEnter={() => setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <div className="bg-card border border-border rounded-xl shadow-lg p-4 min-w-[200px]">
                      <div className="space-y-1">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.label}
                            to={subItem.href}
                            onClick={() => setActiveDropdown(null)}
                            className="block py-2 px-3 text-sm font-nunito text-foreground hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:flex flex-1 max-w-sm mx-4">
            <OmniSearch />
          </div>

          {/* RIGHT: Desktop - Login/Signup + Cart */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-playfair font-medium text-foreground hover:text-primary gap-2"
                    >
                      <User className="w-4 h-4" />
                      {user.name || user.email}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-lg hover:bg-secondary border-border relative"
                    >
                      <Bell className="w-5 h-5 text-foreground" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                    <div className="bg-pink-500 text-white p-4 flex items-center justify-between">
                      <h3 className="font-bold">Notifications</h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20 text-xs h-auto py-1"
                          onClick={(e) => {
                            e.preventDefault();
                            markAllAsRead();
                          }}
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`p-4 border-b hover:bg-muted transition-colors cursor-pointer ${!n.isRead ? 'bg-pink-50/30' : ''}`}
                            onClick={() => markAsRead(n.id)}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className={`text-sm font-bold ${!n.isRead ? 'text-pink-600' : 'text-foreground'}`}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                {n.createdAt ? (() => {
                                  try {
                                    return format(new Date(n.createdAt), 'MMM dd');
                                  } catch (e) {
                                    return 'Just now';
                                  }
                                })() : 'Just now'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {n.message}
                            </p>
                            {n.orderId && (
                              <Link
                                to={`/orders/${n.orderId}`}
                                className="text-[10px] text-primary font-bold mt-2 inline-block hover:underline"
                              >
                                Track Order →
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <DropdownMenuItem asChild>
                        <Link to="/notifications" className="w-full text-center p-3 text-sm font-bold text-gray-500 hover:text-primary border-t">
                          View All Notifications
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to="/cart">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg hover:bg-secondary border-border relative"
                  >
                    <ShoppingCart className="w-5 h-5 text-foreground" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg hover:bg-secondary border-border"
                    title="Login / Sign up"
                  >
                    <User className="w-5 h-5 text-foreground" />
                  </Button>
                </Link>
                <Link to="/cart">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg hover:bg-secondary border-border relative"
                  >
                    <ShoppingCart className="w-5 h-5 text-foreground" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Login + Shopping Bag Icon + Hamburger Menu */}
          <div className="flex lg:hidden items-center gap-2">
            {!user && (
              <Link to="/login">
                <button className="p-2 rounded-full border-2 border-pink-500/50 hover:border-pink-500 transition-colors">
                  <User className="w-5 h-5 text-pink-500" />
                </button>
              </Link>
            )}
            <Link to="/wishlist">
              <button className="p-2 rounded-full border-2 border-pink-400/50 hover:border-pink-500 transition-colors">
                <Heart className="w-5 h-5 text-pink-500" />
              </button>
            </Link>
            <Link to="/cart">
              <button className="p-2 rounded-full border-2 border-primary/50 hover:border-primary transition-colors relative">
                <ShoppingBag className="w-5 h-5 text-primary" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </Link>

            <button
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-fade-up">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <MobileMenuItem key={item.label} item={item} onClose={() => setIsMobileMenuOpen(false)} />
              ))}
              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <Link to="/cart" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full rounded-full">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </Button>
                </Link>
                {user ? (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2 w-full">
                      <Link to="/orders" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full rounded-full gap-2">
                          <ShoppingBag className="w-4 h-4" />
                          Orders
                        </Button>
                      </Link>
                      <Link to="/settings" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full rounded-full gap-2">
                          <User className="w-4 h-4" />
                          Settings
                        </Button>
                      </Link>
                    </div>
                    <Button variant="hopz" size="sm" className="w-full" onClick={logout}>
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" className="flex-1">
                    <Button variant="hopz" size="sm" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const MobileMenuItem = ({
  item,
  onClose
}: {
  item: typeof menuItems[0];
  onClose: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-playfair font-medium text-base py-3 px-4 rounded-xl transition-colors text-foreground hover:bg-secondary"
      >
        <span>{item.label}</span>
        {item.dropdown && (
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {item.dropdown && item.dropdown.length > 0 && isOpen && (
        <div className="pl-4 py-2 space-y-1">
          {item.dropdown.map((subItem) => (
            <Link
              key={subItem.label}
              to={subItem.href}
              onClick={onClose}
              className="block py-2 px-4 text-sm font-nunito text-muted-foreground hover:text-primary transition-colors"
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
