import { useState } from 'react';
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
