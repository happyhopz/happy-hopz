import { Link } from 'react-router-dom';
import { Heart, Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import pandaLogo from '@/assets/happy-hopz-logo.png';

const Footer = () => {
  return (
    <footer className="bg-secondary py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 md:gap-3 mb-4">
              <img src={pandaLogo} alt="Happy Hopz" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
              <span className="text-xl md:text-2xl font-fredoka font-bold text-foreground">
                Happy Hopz
              </span>
            </Link>
            <p className="text-muted-foreground font-nunito text-xs md:text-sm mb-6">
              Where Every Step Is a Happy Hopz – Growing With Your Little Ones. 🐼
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/happyhopzz?igsh=czMyaW1zYTY5ZWtz"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 hover:text-white hover:scale-110 transition-all shadow-sm"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/share/18Hz57kKZa/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-blue-600 hover:text-white hover:scale-110 transition-all shadow-sm border border-border/40"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="mailto:happyhopz308@gmail.com?subject=Enquiry from Happy Hopz Website"
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all shadow-sm border border-border/40"
                title="Email Us"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-fredoka font-semibold text-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <FooterLink to="/products">Shop All</FooterLink>
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
              <FooterLink to="/faq">FAQ</FooterLink>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-fredoka font-semibold text-foreground mb-4">
              Customer Service
            </h4>
            <ul className="space-y-2">
              <FooterLink to="/shipping">Shipping Info</FooterLink>
              <FooterLink to="/returns">Returns & Exchanges</FooterLink>
              <FooterLink to="/size-guide">Size Guide</FooterLink>
              <FooterLink to="/orders">Track Order</FooterLink>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-fredoka font-semibold text-foreground mb-6">
              Stay in the Loop
            </h4>
            <p className="text-muted-foreground text-xs mb-4">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals. 🎁
            </p>
            <NewsletterSignup />

            <div className="mt-8 space-y-4">
              <a
                href="mailto:happyhopz308@gmail.com?subject=Enquiry from Happy Hopz Website"
                className="flex items-center gap-4 text-muted-foreground text-sm font-nunito hover:text-primary transition-all group"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-card flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-border/40">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="font-medium truncate text-xs">happyhopz308@gmail.com</span>
              </a>

              <a
                href="tel:+919711864674"
                className="flex items-center gap-4 text-muted-foreground text-sm font-nunito hover:text-primary transition-all group"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-card flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-border/40">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-medium text-xs">+91 97118 64674</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm font-nunito flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-pink fill-current" /> for little ones © 2026 Happy Hopz
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground font-nunito">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <li>
    <Link
      to={to}
      className="text-muted-foreground text-sm font-nunito hover:text-primary transition-colors"
    >
      {children}
    </Link>
  </li>
);

// New Signup Component
import { useState } from 'react';
import { marketingAPI } from '@/lib/api';
import { toast } from 'sonner';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await marketingAPI.subscribe({ email, source: 'FOOTER' });
      toast.success(res.data.message || 'Subscribed successfully!');
      setEmail('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
      <div className="relative group">
        <input
          id="footer-newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all shadow-sm group-hover:shadow-md"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? 'Joining...' : 'Join the Club 🐼'}
      </button>
    </form>
  );
};

export default Footer;
