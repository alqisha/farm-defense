import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

export interface Plant {
    id: string;
    level: number;
    gridIndex: number; // 0-24
}

export interface Enemy {
    id: string;
    hp: number;
    maxHp: number;
    speed: number;
    progress: number;
    pathIndex: number;
    position: [number, number, number];
    rotation: number;
    isBoss?: boolean;
}

interface GameState {
    wheat: number;
    goldWheat: number;
    plants: Plant[];
    enemies: Enemy[];
    selectedPlantId: string | null;

    // Auth
    session: Session | null;
    telegramUsername: string | null;

    // Progression
    stage: number;    // Global Difficulty Stage (1, 2, 3...)
    wave: number;     // Inner Wave (1-5)
    isWaveActive: boolean;
    lives: number;    // Player Health (if 0 -> Game Over)
    gameStatus: 'MENU' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';
    isMuted: boolean;

    // Actions
    setSession: (session: Session | null) => void;
    toggleMute: () => void;
    setGameState: (state: Partial<GameState>) => void;
    restartLevel: () => void;

    addPlant: (index: number) => void;
    movePlant: (plantId: string, newIndex: number) => void;
    mergePlants: (plantId1: string, plantId2: string) => void;
    selectPlant: (id: string | null) => void;

    // Enemy Actions
    startWave: () => void;
    spawnEnemy: (pathStart: [number, number, number], isBoss?: boolean) => void;
    updateEnemies: (delta: number, path: [number, number, number][]) => void;
    damageEnemy: (id: string, amount: number) => void;
    checkWaveStatus: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    wheat: 100,
    goldWheat: 0,
    plants: [],
    enemies: [],
    selectedPlantId: null,

    session: null,
    telegramUsername: null,

    stage: 1,
    wave: 1,
    lives: 1, // Hard mode: 1 life
    isWaveActive: false,
    gameStatus: 'MENU',
    isMuted: false,

    setSession: (session) => set({ session }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    setGameState: (state) => set(state),

    restartLevel: () => set({
        enemies: [],
        isWaveActive: false,
        lives: 1,
        gameStatus: 'PLAYING',
        wave: 1
    }),

    addPlant: (index) => {
        const { plants } = get();
        if (plants.find(p => p.gridIndex === index)) return;
        if (get().wheat < 10) return;

        const newPlant: Plant = {
            id: crypto.randomUUID(),
            level: 1,
            gridIndex: index,
        };

        set({ plants: [...plants, newPlant], wheat: get().wheat - 10 });
    },

    movePlant: (plantId, newIndex) => {
        set(state => ({
            plants: state.plants.map(p => p.id === plantId ? { ...p, gridIndex: newIndex } : p)
        }));
    },

    mergePlants: (id1, id2) => {
        const { plants } = get();
        const p2 = plants.find(p => p.id === id2);
        if (!p2) return;

        const newLevel = p2.level + 1;

        set({
            plants: plants.filter(p => p.id !== id1 && p.id !== id2).concat({
                ...p2,
                level: newLevel,
                id: p2.id
            })
        })
    },

    selectPlant: (id) => set({ selectedPlantId: id }),

    startWave: () => set({ isWaveActive: true, gameStatus: 'PLAYING' }),

    spawnEnemy: (pathStart, isBoss = false) => {
        const { stage, wave } = get();

        // HP Logic: Base 20, scales heavily with Stage
        // Wave adds difficulty too.
        // E.g. Stage 1, Wave 1: 20 + 20 + 10 = 50 HP.
        // E.g. Stage 2, Wave 1: 20 + 40 + 10 = 70 HP.
        let hp = 20 + (stage * 20) + (wave * 10);

        if (isBoss) {
            hp *= 5; // Boss is 5x tougher than normal creep
        }

        const newEnemy: Enemy = {
            id: crypto.randomUUID(),
            hp: hp,
            maxHp: hp,
            speed: isBoss ? 0.5 : 1, // Boss is slower
            progress: 0,
            pathIndex: 0,
            position: pathStart,
            rotation: 0,
            isBoss
        };
        set(state => ({ enemies: [...state.enemies, newEnemy] }));
    },

    updateEnemies: (delta, path) => {
        set(state => {
            let leaked = false;

            const updatedEnemies = state.enemies.map(enemy => {
                if (enemy.pathIndex >= path.length) {
                    leaked = true;
                    return null;
                }

                const target = path[enemy.pathIndex];
                const dx = target[0] - enemy.position[0];
                const dz = target[2] - enemy.position[2];
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < 0.1) {
                    return { ...enemy, pathIndex: enemy.pathIndex + 1 };
                }

                const moveDist = enemy.speed * delta;
                const ratio = Math.min(moveDist / dist, 1);

                // Calculate Angle (Standard atan2 for top-down: x, z)
                const angle = Math.atan2(dx, dz);

                return {
                    ...enemy,
                    position: [
                        enemy.position[0] + dx * ratio,
                        0,
                        enemy.position[2] + dz * ratio
                    ] as [number, number, number],
                    rotation: angle
                };
            }).filter((e): e is Enemy => e !== null);

            // Handle Leaks
            if (leaked) {
                return {
                    enemies: [],
                    lives: 0,
                    isWaveActive: false,
                    gameStatus: 'GAME_OVER'
                };
            }

            return { enemies: updatedEnemies };
        });
    },

    damageEnemy: (id, amount) => {
        set(state => {
            const enemiesBeforeDamage = state.enemies;
            const enemiesAfterDamage = enemiesBeforeDamage.map(e => {
                if (e.id === id) {
                    return { ...e, hp: e.hp - amount };
                }
                return e;
            });

            const alive = enemiesAfterDamage.filter(e => e.hp > 0);
            const deadCount = enemiesAfterDamage.length - alive.length;

            return {
                enemies: alive,
                wheat: state.wheat + (deadCount * 10) // Reward 10 wheat per kill
            };
        });
        // Check wave status implicitly or explicitly?
        // Better to check explicitly via EnemySystem loop or separate action
    },

    checkWaveStatus: () => {
        const { isWaveActive } = get();
        if (!isWaveActive) return;

        // If no enemies left and we finished spawning... 
        // (Spawning logic is in EnemySystem, but we need to know if we are DONE spawning)
        // This part is tricky without spawn counter.

        // We'll let EnemySystem handle "Are we done spawning?"
        // Here we just handle "All dead? -> Next Wave"

        // Actually, standard TD logic:
        // Spawner spawns N enemies.
        // When all dead -> Wave Clear.
    }
}));
