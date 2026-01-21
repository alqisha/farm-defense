import { useState } from 'react';
import { Wheat, Clock, TrendingUp, Coins } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { SoundManager } from './SoundManager';

export const ClaimDialog = () => {
    const { offlineEarnings, setOfflineEarnings, setGameState, wheat, goldWheat } = useGameStore();
    const [isClaiming, setIsClaiming] = useState(false);

    if (!offlineEarnings) return null;

    const handleClaim = () => {
        setIsClaiming(true);
        SoundManager.playBuy();

        // Animation delay before actually adding funds and closing
        setTimeout(() => {
            setGameState({ wheat: wheat + offlineEarnings.amount });
            setOfflineEarnings(null);
            setIsClaiming(false);
        }, 1000); // 1s animation duration
    };

    const handleDoubleClaim = () => {
        if (goldWheat < 30) return;

        setIsClaiming(true);
        SoundManager.playBuy();

        setTimeout(() => {
            setGameState({
                wheat: wheat + (offlineEarnings.amount * 2),
                goldWheat: goldWheat - 30
            });
            setOfflineEarnings(null);
            setIsClaiming(false);
        }, 1000);
    };

    const formatTime = (h: number) => {
        if (h < 1) return `${Math.floor(h * 60)} minutes`;
        return `${h} hours`;
    };

    return (
        <div className={`absolute inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-500 ${isClaiming ? 'opacity-0 pointer-events-none' : 'animate-in zoom-in duration-300'}`}>

            {/* Flying Particles (Simple implementation) */}
            {isClaiming && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[300]">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-yellow-500 animate-fly-to-top-left"
                            style={{
                                left: `50%`,
                                top: `50%`,
                                animationDelay: `${i * 0.05}s`,
                                transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`
                            }}
                        >
                            <Wheat size={24} />
                        </div>
                    ))}
                </div>
            )}

            <div className={`bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-yellow-500/50 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative flex flex-col items-center gap-4 transition-transform ${isClaiming ? 'scale-0' : 'scale-100'}`}>

                <div className="bg-yellow-500/20 p-4 rounded-full mb-2 animate-bounce">
                    <Wheat size={48} className="text-yellow-400" />
                </div>

                <h2 className="text-3xl font-black text-white text-center">
                    WELCOME BACK!
                </h2>

                <p className="text-gray-400 text-center text-sm">
                    While you were sleeping, your farm kept working.
                </p>

                <div className="w-full bg-black/40 rounded-xl p-4 flex flex-col gap-2 border border-white/10">
                    <div className="flex justify-between text-gray-300">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-blue-400" /> Time Away
                        </div>
                        <span className="font-bold text-white">{formatTime(offlineEarnings.hours)}</span>
                    </div>

                    <div className="flex justify-between text-gray-300">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-green-400" /> Stage Multiplier
                        </div>
                        <span className="font-bold text-green-400">x{offlineEarnings.multiplier}</span>
                    </div>

                    <div className="h-px bg-white/10 my-1" />

                    <div className="flex justify-between text-white text-lg font-bold">
                        <span>Total Earned</span>
                        <span className="text-yellow-400 flex items-center gap-1">
                            +{offlineEarnings.amount} <Wheat size={16} />
                        </span>
                    </div>
                </div>

                <div className="flex gap-3 w-full mt-2">
                    <button
                        onClick={handleClaim}
                        disabled={isClaiming}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isClaiming ? '...' : 'CLAIM'}
                    </button>

                    <button
                        onClick={handleDoubleClaim}
                        disabled={isClaiming || goldWheat < 30}
                        className={`flex-1 font-black text-xl py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 flex-col leading-none ${goldWheat >= 30
                                ? 'bg-yellow-500 hover:bg-yellow-400 text-black hover:scale-105 active:scale-95 shadow-yellow-900/40'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed border-2 border-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-1">
                            x2 CLAIM
                        </div>
                        <div className="text-xs font-bold flex items-center gap-1 opacity-80">
                            30 <Coins size={12} />
                        </div>
                    </button>
                </div>

            </div>
        </div>
    );
};
