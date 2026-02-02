import { Link } from 'react-router-dom';
import { Heart, Instagram, Facebook, Mail, Phone } from 'lucide-react';
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
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-blue-600 hover:text-white hover:scale-110 transition-all shadow-sm"
              >
                <Facebook className="w-5 h-5" />
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

          {/* Contact - Full width on mobile for better email visibility */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-fredoka font-semibold text-foreground mb-4">
              Contact Us
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <li>
                <a
                  href="mailto:happyhopz308@gmail.com"
                  className="flex items-center gap-3 text-muted-foreground text-sm font-nunito hover:text-primary transition-all group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-card flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="truncate">happyhopz308@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/happyhopzz?igsh=czMyaW1zYTY5ZWtz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground text-sm font-nunito hover:text-primary transition-all group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-card flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-pink-500 group-hover:text-white transition-colors shadow-sm">
                    <Instagram className="w-4 h-4" />
                  </div>
                  @happyhopzz
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/share/18Hz57kKZa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground text-sm font-nunito hover:text-primary transition-all group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-card flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                    <Facebook className="w-4 h-4" />
                  </div>
                  Happy Hopz
                </a>
              </li>
            </ul>
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

export default Footer;
