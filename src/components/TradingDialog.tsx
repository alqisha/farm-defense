import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';
import { X, Send } from 'lucide-react';

export const TradingDialog = ({ onClose }: { onClose: () => void }) => {
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('10');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ msg: string, isError: boolean } | null>(null);
    const { goldWheat, setGameState } = useGameStore();

    const handleTransfer = async () => {
        if (!receiver || !amount) return;

        const val = parseInt(amount);
        if (isNaN(val) || val <= 0) {
            setStatus({ msg: 'Invalid amount', isError: true });
            return;
        }
        if (val > goldWheat) {
            setStatus({ msg: 'Insufficient Gold Wheat', isError: true });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const { data, error } = await supabase.rpc('transfer_gold_wheat', {
                receiver_identity: receiver,
                amount: val
            });

            if (error) throw error;

            // data is JSON: { success: boolean, message: string }
            // Supabase RPC returns data directly if not void

            // Typings for RPC can be tricky without generation, assuming simplified return
            // Let's coerce for now since we wrote the function
            const res = data as any;

            if (res && res.success) {
                setStatus({ msg: res.message, isError: false });
                // Optimistic update (PersistenceManager will re-sync eventually, but let's be instant)
                setGameState({ goldWheat: goldWheat - val });
                setTimeout(onClose, 2000);
            } else {
                setStatus({
                    msg: res?.message || 'Transaction Failed',
                    isError: true
                });
            }

        } catch (e: any) {
            setStatus({ msg: e.message || 'Error occurred', isError: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900/90 border border-amber-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-300"></div>

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-amber-400 mb-1 flex items-center gap-2">
                    <Send size={20} /> Transfer Gold
                </h2>
                <p className="text-gray-400 text-sm mb-6">Send Golden Wheat via Email or Telegram Username (@username).</p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase ml-1">Receiver (Email or @username)</label>
                        <input
                            type="text"
                            placeholder="@durov or friend@example.com"
                            value={receiver}
                            onChange={e => setReceiver(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase ml-1">Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-black/50 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                            />
                            <span className="absolute right-4 top-3 text-amber-400 font-bold text-sm">GW</span>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-3 rounded-lg text-sm font-medium text-center ${status.isError ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                            {status.msg}
                        </div>
                    )}

                    <button
                        onClick={handleTransfer}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Confirm Transfer'}
                    </button>
                </div>
            </div>
        </div>
    );
};
