import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import IntroScreen from '@/components/IntroScreen';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturedShoes from '@/components/FeaturedShoes';
import WhyParentsLove from '@/components/WhyParentsLove';
import Footer from '@/components/Footer';

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);

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
        <main>
          <HeroSection />
          <FeaturedShoes />
          <WhyParentsLove />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
