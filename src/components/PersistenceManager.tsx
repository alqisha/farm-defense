import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore, type Plant } from '../store/gameStore';

const tg = (window as any).Telegram?.WebApp;

export const PersistenceManager = () => {
    const { setSession, setGameState, wheat, goldWheat, plants, stage, wave } = useGameStore();

    // 1. Init Auth & Load Data
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) loadData(session.user.id);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) loadData(session.user.id);
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
        }

        if (dbPlants) {
            const loadedPlants: Plant[] = dbPlants.map(p => ({
                id: p.id,
                level: p.plant_level,
                gridIndex: p.grid_index
            }));
            setGameState({ plants: loadedPlants });
        }
    };

    // 2. Auto-Save (Debounced)
    useEffect(() => {
        const timer = setTimeout(async () => {
            const { session } = useGameStore.getState();
            if (!session) return;

            const userId = session.user.id;

            // Save Profile
            // auto-detect TG username if present in env
            const tgUser = tg?.initDataUnsafe?.user?.username;

            await supabase.from('profiles').upsert({
                id: userId,
                wheat_balance: wheat,
                gold_wheat_balance: goldWheat,
                current_stage: stage,
                current_wave: wave,
                ...(tgUser ? { telegram_username: tgUser } : {})
            });

            // Save Plants (Full Sync Strategy - Simplest for Prototype)
            // Ideally we should sync diffs, but for < 25 items, full replace is okay-ish if we handle IDs correctly.
            // Actually, `user_plants` uses UUIDs.

            // For now, let's just Upsert current plants.
            // CAUTION: This doesn't handle deletions (merges) well if we don't delete old ones.
            // To fix merge deletions, we need to delete plants not in the list.

            // Step 1: Get all DB IDs
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
    }, [wheat, goldWheat, plants, stage, wave]);

    return null; // Logic only
};
