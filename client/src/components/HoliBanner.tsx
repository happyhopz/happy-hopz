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
        <div className="relative bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white overflow-hidden">
            {/* Animated background sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1 left-[10%] w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -top-1 left-[30%] w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                <div className="absolute -top-1 left-[50%] w-2 h-2 bg-yellow-200 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
                <div className="absolute -top-1 left-[70%] w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1.5s' }} />
                <div className="absolute -top-1 left-[90%] w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.3s' }} />
            </div>

            <div className="container mx-auto px-4 py-2.5 sm:py-3">
                <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
                    {/* Holi emoji & text */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-lg sm:text-2xl">🎨</span>
                        <div className="text-center sm:text-left">
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-yellow-200">
                                🔥 Holi Sale is LIVE!
                            </p>
                            <p className="text-xs sm:text-sm font-extrabold">
                                Extra <span className="text-yellow-300 text-sm sm:text-lg">10% OFF</span> with code <span className="bg-white/20 px-1.5 py-0.5 rounded text-yellow-200 font-black text-xs sm:text-sm">HOLI10</span>
                            </p>
                        </div>
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <TimeBlock value={timeLeft.days} label="Days" />
                        <span className="text-yellow-300 font-black text-sm sm:text-lg animate-pulse">:</span>
                        <TimeBlock value={timeLeft.hours} label="Hrs" />
                        <span className="text-yellow-300 font-black text-sm sm:text-lg animate-pulse">:</span>
                        <TimeBlock value={timeLeft.minutes} label="Min" />
                        <span className="text-yellow-300 font-black text-sm sm:text-lg animate-pulse">:</span>
                        <TimeBlock value={timeLeft.seconds} label="Sec" />
                    </div>

                    {/* Shop Now CTA */}
                    <Link
                        to="/products"
                        className="hidden sm:inline-flex items-center gap-1 bg-white text-pink-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider hover:bg-yellow-100 transition-colors shadow-lg"
                    >
                        Shop Now →
                    </Link>
                </div>
            </div>

            {/* Dismiss button */}
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 hover:text-white" />
            </button>
        </div>
    );
};

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 min-w-[36px] sm:min-w-[44px]">
        <span className="text-sm sm:text-lg font-black leading-none tabular-nums">
            {String(value).padStart(2, '0')}
        </span>
        <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-white/70 leading-none mt-0.5">
            {label}
        </span>
    </div>
);

export default HoliBanner;
