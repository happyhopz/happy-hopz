import { useState, useEffect } from 'react';
import pandaLogo from '@/assets/happy-hopz-logo.png';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    // Complete transition after 3 seconds
    const completeTimer = setTimeout(() => {
      setIsAnimating(false);
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gradient-hopz transition-opacity duration-700 ${isFading ? 'opacity-0' : 'opacity-100'
        }`}
    >
      {/* Floating decorative elements */}
      <FloatingElements />

      {/* Panda logo with hop animation */}
      <div className="relative z-10 animate-hop">
        <img
          src={pandaLogo}
          alt="Happy Hopz Panda"
          className="w-72 h-72 md:w-96 md:h-96 object-contain drop-shadow-lg"
        />
      </div>

      {/* Loading dots */}
      <div className="mt-8 flex gap-3">
        <span className="w-3.5 h-3.5 rounded-full bg-pink-500 animate-bounce-gentle" style={{ animationDelay: '0ms' }} />
        <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 animate-bounce-gentle" style={{ animationDelay: '150ms' }} />
        <span className="w-3.5 h-3.5 rounded-full bg-purple-500 animate-bounce-gentle" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

// Floating decorative elements component
const FloatingElements = () => {
  const bubbles = [
    { size: 'w-8 h-8', position: 'top-[10%] left-[10%]', delay: '0s', color: 'bg-pink/40' },
    { size: 'w-12 h-12', position: 'top-[15%] right-[15%]', delay: '1s', color: 'bg-cyan/40' },
    { size: 'w-6 h-6', position: 'top-[25%] left-[20%]', delay: '2s', color: 'bg-turquoise/40' },
    { size: 'w-10 h-10', position: 'bottom-[20%] left-[8%]', delay: '0.5s', color: 'bg-lavender/50' },
    { size: 'w-14 h-14', position: 'bottom-[15%] right-[10%]', delay: '1.5s', color: 'bg-magenta/40' },
    { size: 'w-8 h-8', position: 'top-[40%] right-[8%]', delay: '0.8s', color: 'bg-mint/40' },
    { size: 'w-5 h-5', position: 'bottom-[35%] left-[15%]', delay: '2.2s', color: 'bg-primary/30' },
    { size: 'w-10 h-10', position: 'top-[60%] right-[20%]', delay: '1.2s', color: 'bg-secondary/40' },
  ];

  const stars = [
    { position: 'top-[20%] left-[30%]', delay: '0s' },
    { position: 'top-[30%] right-[25%]', delay: '0.5s' },
    { position: 'bottom-[25%] left-[25%]', delay: '1s' },
    { position: 'bottom-[30%] right-[30%]', delay: '1.5s' },
    { position: 'top-[50%] left-[5%]', delay: '0.3s' },
    { position: 'top-[45%] right-[5%]', delay: '0.8s' },
  ];

  return (
    <>
      {/* Bubbles */}
      {bubbles.map((bubble, i) => (
        <div
          key={`bubble-${i}`}
          className={`absolute ${bubble.size} ${bubble.position} ${bubble.color} rounded-full animate-float-slow blur-sm`}
          style={{ animationDelay: bubble.delay }}
        />
      ))}

      {/* Stars */}
      {stars.map((star, i) => (
        <div
          key={`star-${i}`}
          className={`absolute ${star.position} animate-sparkle`}
          style={{ animationDelay: star.delay }}
        >
          <StarIcon />
        </div>
      ))}

      {/* Cloud shapes */}
      <div className="absolute top-[8%] left-[40%] opacity-60">
        <CloudIcon className="w-16 h-10 text-card" />
      </div>
      <div className="absolute bottom-[10%] right-[35%] opacity-50">
        <CloudIcon className="w-20 h-12 text-card" />
      </div>
    </>
  );
};

const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-magenta">
    <path
      d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
      fill="currentColor"
      opacity="0.8"
    />
  </svg>
);

const CloudIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 40" fill="currentColor" className={className}>
    <ellipse cx="20" cy="28" rx="16" ry="12" />
    <ellipse cx="44" cy="28" rx="16" ry="12" />
    <ellipse cx="32" cy="20" rx="18" ry="14" />
  </svg>
);

export default IntroScreen;
