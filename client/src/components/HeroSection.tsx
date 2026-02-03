import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import pandaLogo from '@/assets/happy-hopz-logo.png';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen lg:min-h-[90vh] flex items-center overflow-hidden gradient-hopz">
      {/* Floating decorations */}
      <FloatingDecorations />

      <div className="container mx-auto px-4 py-0 lg:py-16 relative z-10">
        {/* Mobile Layout */}
        <div className="flex flex-col items-center justify-between lg:hidden min-h-screen">
          {/* Top spacing area */}
          <div className="h-8"></div>

          {/* Circular section: Badge + Logo grouped together */}
          <div className="flex flex-col items-center">
            {/* New Collection Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 border-2 border-cyan-400 rounded-full mb-4 animate-fade-up">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-nunito font-extrabold text-black">
                New Collection Available!
              </span>
            </div>

            {/* Logo Circle */}
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />

              {/* Main panda image */}
              <img
                src={pandaLogo}
                alt="Happy Hopz"
                className="relative w-[180px] h-[180px] object-contain animate-bounce-gentle drop-shadow-2xl z-10"
              />

              {/* Decorative rings - centered */}
              <div className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-3 border-4 border-dashed border-cyan/30 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            </div>
          </div>

          {/* Title & Tagline section */}
          <div className="text-center px-4 w-full">
            <h1 className="text-[28px] sm:text-4xl md:text-5xl lg:text-3xl xl:text-7xl font-fredoka font-black leading-tight animate-fade-up opacity-0 delay-100 tracking-tighter !text-black drop-shadow-sm">
              Little Feet, Big Adventures
            </h1>

            <p className="mt-4 text-sm sm:text-base md:text-lg animate-fade-up opacity-0 delay-200 italic font-bold !text-black font-nunito max-w-sm mx-auto">
              Where Every Step Is a Happy Hopz – Growing With Your Little Ones 🐼
            </p>
          </div>

          {/* Buttons section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 animate-fade-up opacity-0 delay-300 w-full">
            <Link to="/products" className="w-full sm:w-auto flex justify-center">
              <Button variant="hopz" size="lg" className="w-full sm:w-52 group bg-white hover:bg-pink-50 text-pink-600 border-2 border-pink-600 font-bold shadow-pink rounded-full text-lg h-14">
                Shop Now
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-52 rounded-full border-2 border-cyan-500 text-black bg-cyan-400 hover:bg-cyan-500 font-black shadow-card h-14 text-lg"
              onClick={() => {
                const element = document.getElementById('featured');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              View Collection
            </Button>
          </div>

          {/* Trust Badges section */}
          <div className="w-full bg-gradient-to-r from-pink-100/50 to-cyan-100/50 py-4 px-4 animate-fade-up opacity-0 delay-500">
            <div className="flex items-center justify-center gap-6">
              <TrustBadge icon="🎀" text="Free Shipping" />
              <TrustBadge icon="💝" text="Easy Returns" />
              <TrustBadge icon="⭐" text="Top Rated" />
            </div>
          </div>
        </div>

        {/* Desktop Layout - Original Side-by-Side */}
        <div className="hidden lg:flex flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 border-2 border-cyan-400 rounded-full mb-6 animate-fade-up">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-nunito font-extrabold text-black">
                New Collection Available!
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-fredoka font-black leading-tight animate-fade-up opacity-0 delay-100 tracking-tight !text-black">
              Little Feet,{' '}
              <span className="drop-shadow-md font-fredoka text-primary">Big Adventures</span>
            </h1>

            <p className="mt-6 text-xl md:text-2xl font-nunito max-w-xl animate-fade-up opacity-0 delay-200 italic font-bold !text-black">
              Where Every Step Is a Happy Hopz – Growing With Your Little Ones 🐼
            </p>

            <div className="mt-10 flex items-center gap-6 animate-fade-up opacity-0 delay-300">
              <Link to="/products">
                <Button variant="hopz" size="lg" className="w-56 group bg-white hover:bg-pink-50 text-pink-600 border-2 border-pink-600 font-bold shadow-pink rounded-full h-16 text-xl">
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-56 rounded-full border-2 border-cyan-500 text-black bg-cyan-400 hover:bg-cyan-500 font-black shadow-card h-16 text-xl"
                onClick={() => {
                  const element = document.getElementById('featured');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                View Collection
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex items-center gap-6 animate-fade-up opacity-0 delay-500">
              <TrustBadge icon="🎀" text="Free Shipping" />
              <TrustBadge icon="💝" text="Easy Returns" />
              <TrustBadge icon="⭐" text="Top Rated" />
            </div>
          </div>

          {/* Hero Image - Panda Logo */}
          <div className="flex-1 flex justify-end">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-75" />

              {/* Main panda image */}
              <img
                src={pandaLogo}
                alt="Happy Hopz - Where Every Step Is a Happy Hopz"
                className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] object-contain animate-bounce-gentle drop-shadow-2xl"
              />

              {/* Decorative rings */}
              <div className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-4 border-4 border-dashed border-cyan/30 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TrustBadge = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-xl">{icon}</span>
    <span className="text-sm font-nunito font-medium text-muted-foreground">{text}</span>
  </div>
);

const FloatingDecorations = () => {
  return (
    <>
      {/* Soft gradient orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink/30 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-500/30 rounded-full blur-3xl animate-pulse-soft delay-500" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-turquoise/30 rounded-full blur-2xl animate-float-slow" />
      <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-lavender/30 rounded-full blur-2xl animate-float-slow delay-700" />





      {/* Subtle pattern dots */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
    </>
  );
};

export default HeroSection;
