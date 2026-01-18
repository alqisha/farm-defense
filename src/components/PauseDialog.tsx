import { X, Trophy, Users, Home, Play } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

interface PauseDialogProps {
    onClose: () => void;
    onShowLeaderboard: () => void;
}

export const PauseDialog = ({ onClose, onShowLeaderboard }: PauseDialogProps) => {
    const { setGameState } = useGameStore();

    const handleMainMenu = () => {
        // Reset to MENU state
        setGameState({ gameStatus: 'MENU', isWaveActive: false, enemies: [] });
        onClose();
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
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative flex flex-col gap-4">

                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        PAUSE
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/10 p-2 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Play fill="currentColor" size={20} /> RESUME
                    </button>

                    <button
                        onClick={onShowLeaderboard}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold text-lg py-3 rounded-xl border border-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Trophy size={20} /> LEADERBOARD
                    </button>

                    <button
                        onClick={handleInvite}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-3 rounded-xl shadow-lg shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Users size={20} /> INVITE FRIEND
                    </button>

                    <div className="h-px bg-white/10 my-1" />

                    <button
                        onClick={handleMainMenu}
                        className="w-full bg-red-900/50 hover:bg-red-800/80 text-red-200 font-bold text-lg py-3 rounded-xl border border-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Home size={20} /> MAIN MENU
                    </button>
                </div>
            </div>
        </div>
    );
};
