import { Play, Trophy } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const MainMenu = ({ onShowLeaderboard }: { onShowLeaderboard: () => void }) => {
    const { setGameState } = useGameStore();

    const handleStart = () => {
        // Switch from MENU -> PLAYING state or just waiting for wave start
        // Actually, logic is: Game loads -> MENU -> User Click -> PLAYING state (Wave 1 inactive) -> User clicks Start Wave
        setGameState({ gameStatus: 'PLAYING' });
    };

    const handleInvite = async () => {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) return;

        const link = `https://t.me/FarmDefBot/game?startapp=ref_${userId}`;
        const telegram = (window as any).Telegram?.WebApp;

        if (telegram) {
            telegram.openTelegramLink(`https://t.me/share/url?url=${link}&text=Join me in Farm Defense and get 50 Gold Wheat! 🌾`);
        } else {
            navigator.clipboard.writeText(link);
            alert('Invite link copied!');
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-900/80 to-black/90 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="text-center p-8 max-w-md w-full flex flex-col items-center">
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2 drop-shadow-lg filter shadow-green-500/50">
                    FARM DEFENSE
                </h1>
                <p className="text-gray-300 mb-12 text-lg font-light tracking-wide">
                    Protect your garden. Merge plants. Survive.
                </p>

                <div className="flex flex-col gap-3 w-64 pointer-events-auto">
                    <button
                        onClick={handleStart}
                        className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl shadow-xl shadow-green-900/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Play fill="currentColor" size={28} /> PLAY
                    </button>

                    <button
                        onClick={onShowLeaderboard}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold text-lg py-3 rounded-2xl border border-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Trophy size={20} /> TOP PLAYERS
                    </button>

                    <button
                        onClick={handleInvite}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-3 rounded-2xl shadow-lg shadow-blue-900/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        🤝 INVITE FRIEND
                    </button>
                </div>

                <div className="mt-8 text-xs text-gray-500">
                    v1.0.0 • 3D Merge Defense
                </div>
            </div>
        </div>
    );
};
