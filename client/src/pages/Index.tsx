import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import IntroScreen from '@/components/IntroScreen';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import HoliBanner from '@/components/HoliBanner';
import FeaturedShoes from '@/components/FeaturedShoes';
import HamperSection from '@/components/HamperSection';
import WhyParentsLove from '@/components/WhyParentsLove';
import Footer from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { contentAPI } from '@/lib/api';

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);

  const { data: layout } = useQuery({
    queryKey: ['homepage-layout'],
    queryFn: async () => {
      try {
        const response = await contentAPI.get('homepage.layout');
        return response.data || [];
      } catch (e) {
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes — layout order rarely changes
  });

  const renderSection = (id: string) => {
    switch (id) {
      case 'holi-banner': return <HoliBanner key="holi-banner" />;
      case 'hero-section': return <HeroSection key="hero-section" />;
      case 'featured-shoes': return <FeaturedShoes key="featured-shoes" />;
      case 'hamper-section': return <HamperSection key="hamper-section" />;
      case 'why-parents-love': return <WhyParentsLove key="why-parents-love" />;
      default: return null;
    }
  };

  const defaultOrder = ['holi-banner', 'hero-section', 'featured-shoes', 'hamper-section', 'why-parents-love'];
  const sectionOrder = layout && Array.isArray(layout) && layout.length > 0 
    ? layout.map((s: any) => s.id) 
    : defaultOrder;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Happy Hopz | Premium Kids Footwear - Stylish & Comfortable Shoes</title>
        <meta name="description" content="Discover Happy Hopz, your destination for premium, stylish, and comfortable kids footwear. Shop our latest collection of sneakers, sandals, and more for happy feet!" />
        <meta property="og:title" content="Happy Hopz | Premium Kids Footwear" />
        <meta property="og:description" content="Premium, stylish, and comfortable kids footwear for every occasion." />
        <meta property="og:url" content="https://happyhopz.com" />
      </Helmet>
      {/* Animated Intro Screen */}
      {showIntro && (
        <IntroScreen onComplete={() => setShowIntro(false)} />
      )}

      {/* Main Content - visible after intro */}
      <div className={`transition-opacity duration-500 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
        <Navbar />
        {sectionOrder.includes('holi-banner') && sectionOrder[0] === 'holi-banner' && renderSection('holi-banner')}
        <main>
          {sectionOrder.map(id => {
            if (id === 'holi-banner' && sectionOrder[0] === 'holi-banner') return null;
            return renderSection(id);
          })}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
