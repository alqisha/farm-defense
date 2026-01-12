import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, ShoppingBag, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SoundManager } from './SoundManager';

const PACKAGES = [
    { id: 'small', name: 'Мешочек зерна', price: 5, amount: 100, bonus: 0, color: 'bg-amber-100', text: 'text-amber-800' },
    { id: 'pack', name: 'Пакет зерна', price: 10, amount: 200, bonus: 19, color: 'bg-amber-200', text: 'text-amber-900' },
    { id: 'big_pack', name: 'Большой пакет зерна', price: 30, amount: 500, bonus: 59, color: 'bg-amber-300', text: 'text-amber-900' },
    { id: 'sack', name: 'Мешок зерна', price: 70, amount: 1100, bonus: 150, color: 'bg-amber-400', text: 'text-amber-950' },
    { id: 'cart', name: 'Телега зерна', price: 150, amount: 2500, bonus: 400, color: 'bg-yellow-500', text: 'text-black' },
];

export const ShopDialog = ({ onClose }: { onClose: () => void }) => {
    const { setGameState, goldWheat } = useGameStore();
    const [loading, setLoading] = useState<string | null>(null);

    const handleBuy = async (pkg: typeof PACKAGES[0]) => {
        setLoading(pkg.id);

        // Mock Purchase Flow
        // In real app: Calls Payment Provider -> Verify Webhook -> Add Funds
        // Here: Simulate 1s delay -> Add funds via Supabase

        try {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) throw new Error('Not logged in');

            await new Promise(r => setTimeout(r, 1000)); // Simluate payment processing

            // Update local state (Optimistic)
            const total = pkg.amount + pkg.bonus;

            // In a real scenario, this update should come from the server via RPC or webhook
            // We will simulate it here by modifying the profile directly for the demo
            const { error } = await supabase.rpc('add_gold_wheat', {
                amount_to_add: total
            });

            if (error) {
                // Fallback if RPC doesn't exist yet (we haven't made it, so we'll do Client-side update for prototype)
                // NOTE: This is insecure for prod, but fine for prototype
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ gold_wheat_balance: goldWheat + total }) // Use logic to increment if possible, but strict mode
                    .eq('id', userId);

                if (updateError) throw updateError;
            }

            setGameState({ goldWheat: goldWheat + total });
            SoundManager.playBuy();
            alert(`Успешно куплено: ${pkg.name}!`);
        } catch (e: any) {
            console.error(e);
            alert('Ошибка покупки: ' + e.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-amber-500/30 p-6 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                        <ShoppingBag size={24} /> Магазин Зерна
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {PACKAGES.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`relative group overflow-hidden rounded-xl p-4 transition-all hover:scale-[1.02] border border-transparent hover:border-amber-400/50 ${pkg.color} ${pkg.text}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">{pkg.name}</h3>
                                    <p className="opacity-80 text-sm">{pkg.amount} GW</p>
                                    {pkg.bonus > 0 && (
                                        <span className="inline-block bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                                            +{pkg.bonus} BONUS
                                        </span>
                                    )}
                                </div>
                                <div className="text-xl font-black">${pkg.price}</div>
                            </div>

                            <button
                                onClick={() => handleBuy(pkg)}
                                disabled={loading !== null}
                                className="mt-4 w-full bg-black/20 hover:bg-black/40 text-current font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {loading === pkg.id ? (
                                    <span className="animate-spin">⏳</span>
                                ) : (
                                    <>
                                        <CreditCard size={16} /> Купить
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
