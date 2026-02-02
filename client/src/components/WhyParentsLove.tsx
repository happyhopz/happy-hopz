import { Heart, Shield, Truck, RefreshCw } from 'lucide-react';

const WhyParentsLove = () => {
  const features = [
    {
      icon: Heart,
      title: 'Made with Love',
      description: 'Every shoe is crafted with care, using child-safe materials that are gentle on little feet.',
      color: 'bg-pink',
      iconColor: 'text-foreground',
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'Built to last through playground adventures, puddle jumping, and endless playtime.',
      color: 'bg-hopz-cyan',
      iconColor: 'text-foreground',
    },
    {
      icon: Truck,
      title: 'Fast & Free Shipping',
      description: 'Get your order delivered quickly with free shipping on all orders over $50.',
      color: 'bg-turquoise',
      iconColor: 'text-foreground',
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      description: '30-day hassle-free returns. If the shoe doesn\'t fit, we\'ll make it right!',
      color: 'bg-lavender',
      iconColor: 'text-foreground',
    },
  ];

  return (
    <section id="about" className="py-20 gradient-hopz">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-primary/20 rounded-full text-sm font-nunito font-semibold text-primary-foreground mb-4">
            💖 Parents Trust Us
          </span>
          <h2 className="text-3xl md:text-4xl font-fredoka font-bold text-foreground">
            Why Parents Love Happy Hopz
          </h2>
          <p className="mt-4 text-muted-foreground font-nunito max-w-lg mx-auto">
            Join thousands of happy families who trust us with their children's first steps and beyond.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard number="50K+" label="Happy Kids" emoji="👶" />
          <StatCard number="4.9" label="Star Rating" emoji="⭐" />
          <StatCard number="100%" label="Satisfaction" emoji="💯" />
          <StatCard number="24/7" label="Support" emoji="💬" />
        </div>
      </div>
    </section>
  );
};

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  iconColor: string;
}

const FeatureCard = ({ feature, index }: { feature: Feature; index: number }) => {
  const Icon = feature.icon;

  return (
    <div
      className="bg-card rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-card hover:shadow-float transition-all duration-300 hover:-translate-y-1 animate-fade-up opacity-0"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      <div className={`w-10 h-10 md:w-14 md:h-14 ${feature.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4`}>
        <Icon className={`w-5 h-5 md:w-7 md:h-7 ${feature.iconColor}`} />
      </div>
      <h3 className="font-fredoka font-semibold text-sm md:text-lg text-foreground mb-1 md:mb-2">
        {feature.title}
      </h3>
      <p className="text-[10px] md:text-sm text-muted-foreground font-nunito leading-tight md:leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
};

const StatCard = ({ number, label, emoji }: { number: string; label: string; emoji: string }) => (
  <div className="text-center p-6 bg-card/50 rounded-2xl backdrop-blur-sm">
    <span className="text-2xl mb-2 block">{emoji}</span>
    <span className="text-3xl md:text-4xl font-fredoka font-bold text-primary block">
      {number}
    </span>
    <span className="text-sm text-muted-foreground font-nunito">
      {label}
    </span>
  </div>
);

export default WhyParentsLove;
