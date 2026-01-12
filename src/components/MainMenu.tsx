import { Play } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const MainMenu = () => {
    const { setGameState } = useGameStore();

    const handleStart = () => {
        // Switch from MENU -> PLAYING state or just waiting for wave start
        // Actually, logic is: Game loads -> MENU -> User Click -> PLAYING state (Wave 1 inactive) -> User clicks Start Wave
        setGameState({ gameStatus: 'PLAYING' });
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-900/80 to-black/90 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="text-center p-8 max-w-md w-full">
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2 drop-shadow-lg filter shadow-green-500/50">
                    FARM DEFENSE
                </h1>
                <p className="text-gray-300 mb-12 text-lg font-light tracking-wide">
                    Protect your garden. Merge plants. Survive.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleStart}
                        className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl shadow-xl shadow-green-900/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Play fill="currentColor" size={28} /> PLAY
                    </button>
                </div>

                <div className="mt-8 text-xs text-gray-500">
                    v1.0.0 • 3D Merge Defense
                </div>
            </div>
        </div>
    );
};
