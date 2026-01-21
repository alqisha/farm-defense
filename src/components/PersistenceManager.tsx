import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore, type Plant } from '../store/gameStore';
import { SoundManager } from './SoundManager';

const tg = (window as any).Telegram?.WebApp;

export const PersistenceManager = () => {
    const {
        setSession, setGameState, wheat, goldWheat, plants, stage, wave,
        isDataLoaded, setDataLoaded, setOfflineEarnings
    } = useGameStore();

    const loadedRef = useRef(false);

    // 1. Init Auth & Load Data
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session && !loadedRef.current) {
                loadedRef.current = true; // Prevent double load
                loadData(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session && !loadedRef.current) {
                loadedRef.current = true;
                loadData(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadData = async (userId: string) => {
        // Load Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('wheat_balance, gold_wheat_balance, current_stage, current_wave, telegram_username')
            .eq('id', userId)
            .single();

        // Load Plants
        const { data: dbPlants } = await supabase
            .from('user_plants')
            .select('*')
            .eq('user_id', userId);

        if (profile) {
            setGameState({
                wheat: profile.wheat_balance,
                goldWheat: profile.gold_wheat_balance,
                stage: profile.current_stage || 1,
                wave: profile.current_wave || 1,
                telegramUsername: profile.telegram_username
            });

            // CHECK OFFLINE INCOME V2
            const totalProduction = dbPlants ? dbPlants.reduce((acc, p) => acc + p.plant_level, 0) : 0;

            if (totalProduction > 0) {
                // Call V2 RPC
                console.log('Checking offline income...');
                const { data: result, error } = await supabase.rpc('claim_offline_income_v2', {
                    production_rate_per_sec: totalProduction
                });

                if (error) {
                    console.error('Offline Income Error:', error);
                } else {
                    console.log('Offline Income Result:', result);
                    // Result format: { earned: 100, hours: 2, multiplier: 1.5 }
                    if (result && result.earned > 0) {
                        // Display immediately
                        setOfflineEarnings({
                            amount: result.earned,
                            hours: result.hours,
                            multiplier: result.multiplier
                        });
                        SoundManager.playMerge(); // Alert user
                    }
                }
            }

            // CHECK REFERRAL (Start Param)
            const startParam = tg?.initDataUnsafe?.start_param;
            if (startParam && startParam.startsWith('ref_')) {
                const referrerId = startParam.replace('ref_', '');
                await supabase.rpc('process_referral', { referrer_id: referrerId });
            }
        }

        if (dbPlants) {
            const loadedPlants: Plant[] = dbPlants.map(p => ({
                id: p.id,
                level: p.plant_level,
                gridIndex: p.grid_index
            }));
            setGameState({ plants: loadedPlants });
        }

        // Critical: Mark data as loaded so auto-save can proceed
        setDataLoaded(true);
        console.log('Data loaded successfully');
    };

    // 2. Auto-Save (Debounced)
    useEffect(() => {
        // SAFETY: Do not save if data hasn't loaded yet!
        if (!isDataLoaded) return;

        const timer = setTimeout(async () => {
            const { session } = useGameStore.getState();
            if (!session) return;

            const userId = session.user.id;
            console.log('Auto-saving...');

            // Save Profile
            // auto-detect TG username if present in env
            const tgUser = tg?.initDataUnsafe?.user;
            const username = tgUser?.username || tgUser?.first_name || 'Farmer';

            await supabase.from('profiles').upsert({
                id: userId,
                wheat_balance: wheat,
                gold_wheat_balance: goldWheat,
                current_stage: stage,
                current_wave: wave,
                ...(username ? { telegram_username: username } : {})
            });

            // Save Plants (Upsert + Delete stale)
            const { data: currentDbPlants } = await supabase.from('user_plants').select('id').eq('user_id', userId);
            const currentDbIds = currentDbPlants?.map(p => p.id) || [];
            const localIds = plants.map(p => p.id);

            // Step 2: Delete IDs missing locally
            const toDelete = currentDbIds.filter(id => !localIds.includes(id));
            if (toDelete.length > 0) {
                await supabase.from('user_plants').delete().in('id', toDelete);
            }

            // Step 3: Upsert local plants
            const upsertData = plants.map(p => ({
                id: p.id,
                user_id: userId,
                plant_level: p.level,
                grid_index: p.gridIndex
            }));

            if (upsertData.length > 0) {
                await supabase.from('user_plants').upsert(upsertData);
            }

            console.log('Saved to Supabase');

        }, 2000); // Save every 2 seconds of inactivity

        return () => clearTimeout(timer);
    }, [wheat, goldWheat, plants, stage, wave, isDataLoaded]);

    return null; // Logic only
};
