import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, X, Shield, Medal, Gift } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface LeaderboardEntry {
    id: string; // Need ID for transfer
    username: string;
    stage: number;
    wave: number;
    gold: number;
}

export const LeaderboardDialog = ({ onClose }: { onClose: () => void }) => {
    const { session, setGameState, goldWheat } = useGameStore();
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [transferTarget, setTransferTarget] = useState<LeaderboardEntry | null>(null);
    const [transferAmount, setTransferAmount] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: 50 });
            if (!error && data) {
                setLeaders(data as LeaderboardEntry[]);
            }
            setLoading(false);
        };
        fetchLeaderboard();
    }, []);

    const handleTransfer = async () => {
        if (!transferTarget || !transferAmount) return;
        const amount = parseInt(transferAmount);

        if (isNaN(amount) || amount <= 0) {
            alert('Invalid amount');
            return;
        }
        if (amount > goldWheat) {
            alert('Insufficient funds');
            return;
        }

        const confirm = window.confirm(`Send ${amount} GW to ${transferTarget.username}?`);
        if (!confirm) return;

        try {
            const { data, error } = await supabase.rpc('transfer_gold', {
                receiver_id: transferTarget.id,
                amount: amount
            });

            if (error) throw error;
            const res = data as any;
            if (!res.success) throw new Error(res.error || 'Transfer failed');

            setGameState({ goldWheat: res.new_balance });
            alert(`Successfully sent ${amount} GW to ${transferTarget.username}!`);
            setTransferTarget(null);
            setTransferAmount('');
        } catch (e: any) {
            alert('Error: ' + e.message);
        }
    };

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return 'text-yellow-400';
            case 1: return 'text-gray-300';
            case 2: return 'text-amber-600';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-yellow-500/30 p-6 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[80vh]">

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 flex items-center justify-center gap-3">
                        <Trophy className="text-yellow-400" size={32} /> TOP 50
                    </h2>
                    <p className="text-gray-400 text-sm">Best defenders of the farm</p>
                </div>

                {/* Transfer Overlay */}
                {transferTarget && (
                    <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center p-6 rounded-2xl animate-in fade-in">
                        <h3 className="text-xl font-bold text-white mb-4">Gift to {transferTarget.username}</h3>
                        <input
                            type="number"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 mb-4 w-full text-center text-xl font-bold"
                            placeholder="Amount"
                        />
                        <div className="flex gap-2 w-full">
                            <button onClick={() => setTransferTarget(null)} className="flex-1 py-2 bg-gray-700 rounded-lg text-white font-bold">Cancel</button>
                            <button onClick={handleTransfer} className="flex-1 py-2 bg-yellow-500 rounded-lg text-black font-bold">SEND</button>
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading champions...</div>
                    ) : (
                        <div className="space-y-2">
                            {leaders.map((player, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-4 p-3 rounded-xl border ${idx < 3 ? 'bg-yellow-900/10 border-yellow-500/20' : 'bg-gray-800/50 border-transparent'}`}
                                >
                                    <div className={`font-black text-xl w-8 text-center ${getMedalColor(idx)}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {player.username}
                                            {idx < 3 && <Medal size={14} className={getMedalColor(idx)} />}
                                        </div>
                                        <div className="text-xs text-gray-400 flex gap-3">
                                            <span className="flex items-center gap-1"><Shield size={10} /> Stage {player.stage}-{player.wave}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <div className="font-mono font-bold text-amber-400">
                                            {player.gold} GW
                                        </div>
                                        {/* Gift Button (Don't show for self) */}
                                        {player.id !== session?.user.id && (
                                            <button
                                                onClick={() => setTransferTarget(player)}
                                                className="bg-green-600/20 hover:bg-green-600/40 text-green-400 p-1.5 rounded-lg transition-colors"
                                                title="Send Gift"
                                            >
                                                <Gift size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
