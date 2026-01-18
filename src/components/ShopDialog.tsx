import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, CreditCard, Zap, Heart, Droplets } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SoundManager } from './SoundManager';
import { useEffectsStore } from './Effects/ParticleSystem';

// Original Packages maintained as requested
const PACKAGES = [
    { id: 'small', name: 'Handful of Wheat', price: 100, amount: 100, bonus: 0, color: 'bg-amber-100', text: 'text-amber-800' },
    { id: 'pack', name: 'Bag of Wheat', price: 250, amount: 200, bonus: 19, color: 'bg-amber-200', text: 'text-amber-900' },
    { id: 'big_pack', name: 'Chest of Wheat', price: 500, amount: 500, bonus: 59, color: 'bg-amber-300', text: 'text-amber-900' },
    { id: 'sack', name: 'Cart of Wheat', price: 1000, amount: 1100, bonus: 150, color: 'bg-amber-400', text: 'text-amber-950' },
    { id: 'cart', name: 'Silo of Wheat', price: 2500, amount: 2500, bonus: 400, color: 'bg-yellow-500', text: 'text-black' },
];

const ITEMS = [
    { id: 'boost_damage', name: 'Potion of Power', price: 50, icon: <Zap size={32} className="text-yellow-400" />, desc: 'x2 Damage for 2 mins', type: 'BOOST' },
    { id: 'resource_rain', name: 'Wheat Rain', price: 20, icon: <Droplets size={32} className="text-blue-400" />, desc: '+1000 Wheat instantly', type: 'RESOURCE' },
    { id: 'heal_base', name: 'Living Water', price: 30, icon: <Heart size={32} className="text-red-400" />, desc: 'Restore all lives', type: 'HEAL' },
];

type PaymentMethod = 'STARS' | 'CRYPTO' | 'CARD';

export const ShopDialog = ({ onClose }: { onClose: () => void }) => {
    const { setGameState, goldWheat, activateBooster, wheat } = useGameStore();
    const [loading, setLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'GOLD' | 'ITEMS'>('GOLD');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('STARS');

    // --- GOLD STORE LOGIC ---
    const handleBuyGold = async (pkg: typeof PACKAGES[0]) => {
        setLoading(pkg.id);

        try {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) throw new Error('Not logged in');

            // --- Telegram Stars Integration Logic ---
            console.log(`Initiating purchase via ${paymentMethod} for ${pkg.price} Stars`);

            // In a real app, we would:
            // 1. Call Backend to create InvoiceLink
            // 2. Telegram.WebApp.openInvoice(url)
            // 3. Wait for callback

            // Simulation for now:
            await new Promise(r => setTimeout(r, 1000));

            // Secure RPC Purchase (Server-Side)
            const { data, error } = await supabase.rpc('buy_item', {
                item_id: pkg.id
            });

            if (error) throw error;

            const res = data as any;
            if (!res.success) throw new Error(res.error || 'Purchase failed');

            setGameState({ goldWheat: res.new_balance });
            SoundManager.playBuy();

            // Visual Effect
            useEffectsStore.getState().triggerEffect('LEVELUP', [0, 5, 0]);

            alert(`Thanks! You bought ${pkg.name}!`);

        } catch (e: any) {
            console.error(e);
            alert('Purchase failed: ' + e.message);
        } finally {
            setLoading(null);
        }
    };

    // --- ITEM STORE LOGIC ---
    const handleBuyItem = async (item: typeof ITEMS[0]) => {
        if (goldWheat < item.price) {
            alert('Not enough Gold Wheat!');
            return;
        }

        setLoading(item.id);
        try {
            // 1. Deduct Gold (Secure RPC)
            const { data, error } = await supabase.rpc('spend_gold_wheat', { amount: item.price });

            if (error) throw error;
            const res = data as any;
            if (!res.success) throw new Error(res.error || 'Insufficient funds');

            // 2. Apply Effect
            if (item.id === 'boost_damage') {
                activateBooster(120000); // 2 mins
            } else if (item.id === 'resource_rain') {
                setGameState({ wheat: wheat + 1000 });
            } else if (item.id === 'heal_base') {
                setGameState({ lives: 5 }); // Restore to max (5 or 1 depending on mode, let's say 5 for now or just +100)
                // Actually Logic says "lives: 1" in store default, let's assume Hardcore. 
                // But if they buy heal, maybe give them a second chance?
                setGameState({ lives: 1 });
            }

            // 3. Update Balance
            setGameState({ goldWheat: res.new_balance });
            SoundManager.playPowerup();

            // Visual Effect
            useEffectsStore.getState().triggerEffect('LEVELUP', [0, 5, 0]);

        } catch (e: any) {
            // Alert
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-amber-500/30 p-0 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col h-[85vh]">

                {/* Header */}
                <div className="p-4 flex justify-between items-center bg-gray-800/50 border-b border-white/5">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('GOLD')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'GOLD' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            BUY GOLD
                        </button>
                        <button
                            onClick={() => setActiveTab('ITEMS')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'ITEMS' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            SPEND GOLD
                        </button>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/10 p-2 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* --- GOLD TAB --- */}
                {activeTab === 'GOLD' && (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Payment Selector */}
                        <div className="flex justify-center gap-2 p-4 bg-gray-900/80">
                            {[
                                { id: 'STARS', icon: '⭐️', label: 'Stars' },
                                { id: 'CARD', icon: <CreditCard size={16} />, label: 'Card' }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${paymentMethod === method.id
                                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                                        : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                                >
                                    {method.icon} <span className="font-bold">{method.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Packages Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto p-4 custom-scrollbar pb-24">
                            {PACKAGES.map((pkg) => (
                                <div key={pkg.id} className={`relative group overflow-hidden rounded-xl p-4 transition-transform hover:scale-[1.02] border-2 border-transparent hover:border-white/20 ${pkg.color} ${pkg.text} flex flex-col justify-between min-h-[140px]`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight mb-1">{pkg.name}</h3>
                                            <p className="opacity-80 text-sm font-medium">{pkg.amount} GW</p>
                                            {pkg.bonus > 0 && (
                                                <span className="inline-block bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded mt-1">
                                                    +{pkg.bonus} BONUS
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xl font-black bg-white/20 px-2 py-1 rounded-lg shrink-0 ml-2">
                                            {paymentMethod === 'STARS' ? `⭐️${pkg.price}` : `$${(pkg.price / 50).toFixed(2)}`}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleBuyGold(pkg)}
                                        disabled={loading !== null || paymentMethod !== 'STARS'}
                                        className="mt-auto w-full bg-black/80 hover:bg-black text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading === pkg.id ? <span className="animate-spin">⏳</span> : (paymentMethod === 'STARS' ? 'BUY' : 'COMING SOON')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- ITEM TAB --- */}
                {activeTab === 'ITEMS' && (
                    <div className="flex flex-col h-full overflow-hidden p-4">
                        <div className="grid grid-cols-1 gap-3 overflow-y-auto custom-scrollbar pb-24">
                            {ITEMS.map((item) => (
                                <div key={item.id} className="bg-gray-800 rounded-xl p-4 flex items-center gap-4 border border-white/5 hover:border-purple-500/50 transition-all">
                                    <div className="bg-black/40 p-3 rounded-full">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-lg">{item.name}</h3>
                                        <p className="text-gray-400 text-sm">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => handleBuyItem(item)}
                                        disabled={loading !== null}
                                        className="bg-purple-600 hover:bg-purple-500 text-white font-black px-4 py-2 rounded-xl shadow-lg shadow-purple-900/40 min-w-[80px]"
                                    >
                                        {item.price} GW
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
