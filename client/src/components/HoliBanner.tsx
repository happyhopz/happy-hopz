import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const SALE_END = new Date('2026-03-04T23:59:59+05:30').getTime();

const HoliBanner = () => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const diff = Math.max(0, SALE_END - now);
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    if (dismissed || Date.now() > SALE_END) return null;

    return (
        <div
            className="relative w-full z-40"
            style={{
                background: 'linear-gradient(90deg, #ff6b35 0%, #e91e63 40%, #9c27b0 100%)',
            }}
        >
            {/* Animated sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1 left-[10%] w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute top-1 left-[30%] w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                <div className="absolute top-1 left-[50%] w-1.5 h-1.5 bg-yellow-200 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
                <div className="absolute top-1 left-[70%] w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1.5s' }} />
                <div className="absolute top-1 left-[90%] w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.3s' }} />
            </div>

            <div className="max-w-7xl mx-auto px-3 py-2 sm:py-2.5 relative">
                <div className="flex items-center justify-center gap-2 sm:gap-6 flex-wrap">
                    {/* Holi emoji & text */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        <span className="text-base sm:text-xl">🎨</span>
                        <div>
                            <p className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-yellow-200 leading-tight">
                                🔥 Holi Sale LIVE
                            </p>
                            <p className="text-[10px] sm:text-sm font-extrabold text-white leading-tight">
                                Extra <span className="text-yellow-300 text-xs sm:text-base font-black">10% OFF</span> — Use <span className="bg-white/20 px-1 py-0.5 rounded text-yellow-200 font-black text-[10px] sm:text-xs">HOLI10</span>
                            </p>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="hidden sm:block w-px h-8 bg-white/30" />

                    {/* Countdown */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        <TimeBlock value={timeLeft.days} label="Days" />
                        <span className="text-yellow-300 font-black text-xs sm:text-sm animate-pulse">:</span>
                        <TimeBlock value={timeLeft.hours} label="Hrs" />
                        <span className="text-yellow-300 font-black text-xs sm:text-sm animate-pulse">:</span>
                        <TimeBlock value={timeLeft.minutes} label="Min" />
                        <span className="text-yellow-300 font-black text-xs sm:text-sm animate-pulse">:</span>
                        <TimeBlock value={timeLeft.seconds} label="Sec" />
                    </div>

                    {/* Shop Now CTA */}
                    <Link
                        to="/products"
                        className="hidden sm:inline-flex items-center gap-1 bg-white text-pink-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-yellow-100 transition-colors shadow-lg"
                    >
                        Shop Now →
                    </Link>
                </div>
            </div>

            {/* Dismiss */}
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-1/2 -translate-y-1/2 right-1.5 sm:right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close banner"
            >
                <X className="w-3 h-3 sm:w-4 sm:h-4 text-white/70 hover:text-white" />
            </button>
        </div>
    );
};

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center rounded-md px-1.5 py-0.5 sm:px-2.5 sm:py-1 min-w-[30px] sm:min-w-[40px]" style={{ background: 'rgba(255,255,255,0.15)' }}>
        <span className="text-xs sm:text-base font-black leading-none tabular-nums text-white">
            {String(value).padStart(2, '0')}
        </span>
        <span className="text-[6px] sm:text-[8px] font-bold uppercase tracking-wider text-white/70 leading-none mt-0.5">
            {label}
        </span>
    </div>
);

export default HoliBanner;
