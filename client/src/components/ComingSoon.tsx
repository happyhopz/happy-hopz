import { Sparkles, Gift, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ComingSoon = () => {
  const upcomingCategories = [
    {
      icon: Gift,
      title: 'Toys',
      description: 'Fun, safe, and educational toys for endless imagination.',
      color: 'bg-pink',
      emoji: '🧸',
    },
    {
      icon: Shirt,
      title: 'Clothes',
      description: 'Adorable outfits that are as comfy as they are cute.',
      color: 'bg-cyan',
      emoji: '👕',
    },
    {
      icon: Sparkles,
      title: 'Accessories',
      description: 'Little extras to complete the perfect look.',
      color: 'bg-lavender',
      emoji: '🎀',
    },
  ];

  return (
    <section className="py-20 bg-card overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-magenta/30 rounded-full mb-4 animate-wiggle">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-nunito font-bold text-foreground">
              More Magic Coming!
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-fredoka font-bold text-foreground">
            Coming Soon to Happy Hopz
          </h2>
          <p className="mt-4 text-muted-foreground font-nunito max-w-md mx-auto">
            We're expanding our family! Get ready for even more ways to make your little ones smile.
          </p>
        </div>

        {/* Coming Soon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {upcomingCategories.map((category, index) => (
            <ComingSoonCard key={index} category={category} index={index} />
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="gradient-pink-cyan rounded-3xl p-8 text-center shadow-card">
            <h3 className="text-2xl font-fredoka font-bold text-foreground mb-3">
              Be the First to Know! 🎉
            </h3>
            <p className="text-muted-foreground font-nunito mb-6">
              Sign up for exclusive early access and special launch discounts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-full bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 font-nunito text-foreground placeholder:text-muted-foreground"
              />
              <Button variant="hopz" size="lg">
                Notify Me
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface Category {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  emoji: string;
}

const ComingSoonCard = ({ category, index }: { category: Category; index: number }) => {
  const Icon = category.icon;
  
  return (
    <div 
      className="relative group bg-background rounded-3xl p-8 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 text-center animate-fade-up opacity-0 overflow-hidden"
      style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
    >
      {/* Background decoration */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${category.color}/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
      
      {/* Emoji */}
      <span className="text-5xl mb-4 block animate-bounce-gentle" style={{ animationDelay: `${index * 200}ms` }}>
        {category.emoji}
      </span>
      
      {/* Icon */}
      <div className={`w-12 h-12 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
        <Icon className="w-6 h-6 text-foreground" />
      </div>
      
      <h3 className="font-fredoka font-semibold text-xl text-foreground mb-2">
        {category.title}
      </h3>
      <p className="text-sm text-muted-foreground font-nunito">
        {category.description}
      </p>

      {/* Coming Soon Badge */}
      <div className="mt-4 inline-block px-4 py-1 bg-muted rounded-full">
        <span className="text-xs font-nunito font-semibold text-muted-foreground">
          Coming 2026
        </span>
      </div>
    </div>
  );
};

export default ComingSoon;
