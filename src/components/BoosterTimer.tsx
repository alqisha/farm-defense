import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Zap } from 'lucide-react';

export const BoosterTimer = () => {
    const { boosterEndTime } = useGameStore();
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!boosterEndTime) {
            setTimeLeft(0);
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = boosterEndTime - now;
            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(diff);
            }
        }, 100); // 10Hz update for smooth countdown

        return () => clearInterval(interval);
    }, [boosterEndTime]);

    if (timeLeft <= 0) return null;

    const seconds = Math.floor(timeLeft / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 border border-yellow-500/50 animate-pulse-glow shadow-[0_0_15px_rgba(234,179,8,0.5)]">
            <Zap className="text-yellow-400 animate-pulse" size={16} fill="currentColor" />
            <span className="text-white font-black font-mono text-sm">
                2X DAMAGE: {minutes}:{remainingSeconds.toString().padStart(2, '0')}
            </span>
        </div>
    );
};
