import { useFrame } from '@react-three/fiber';
import { useGameStore, type Enemy } from '../store/gameStore';
import { Line, Html } from '@react-three/drei';
import { useRef } from 'react';
import { EnemyModel } from './Models/EnemyModel';

const PATH_POINTS: [number, number, number][] = [
    [-4, 0, -4], // Start
    [-4, 0, 4],  // Down Left
    [4, 0, 4],   // Down Right
    [4, 0, -4],  // Top Right
    [0, 0, -4],  // Top Center (Finish)
];

const SPAWN_INTERVAL = 1500;

export const EnemySystem = () => {
    const {
        enemies, spawnEnemy, updateEnemies, isWaveActive,
        wave, stage, setGameState, wheat
    } = useGameStore();

    const lastSpawnTime = useRef(0);
    const enemiesSpawned = useRef(0);
    const waveComplete = useRef(false);

    // Calculate total enemies for this wave
    // Waves 1-4: 5 + (wave * 2) enemies
    // Wave 5: 1 Boss
    const isBossWave = wave % 5 === 0;
    const totalToSpawn = isBossWave ? 1 : 5 + (wave * 2);

    // Game Loop
    useFrame((state, delta) => {
        if (isWaveActive) {
            const now = state.clock.elapsedTime * 1000;

            // Spawning Logic
            if (enemiesSpawned.current < totalToSpawn) {
                if (now - lastSpawnTime.current > SPAWN_INTERVAL) {
                    spawnEnemy(PATH_POINTS[0], isBossWave);
                    enemiesSpawned.current += 1;
                    lastSpawnTime.current = now;
                }
            } else {
                // All spawned. Check if all dead.
                if (enemies.length === 0 && !waveComplete.current) {
                    // WAVE CLEARED!
                    waveComplete.current = true;

                    // Logic for next wave
                    setTimeout(() => {
                        handleWaveComplete();
                    }, 1000);
                }
            }

            // Movement
            updateEnemies(delta, PATH_POINTS);
        }
    });

    const handleWaveComplete = () => {
        // Reset counters
        enemiesSpawned.current = 0;
        waveComplete.current = false;

        // Rewards
        const reward = isBossWave ? 100 : 20 + (wave * 5);

        let newWave = wave + 1;
        let newStage = stage;

        if (isBossWave) {
            // Boss Defeated! Next Stage.
            newStage += 1;
            // newWave continues incrementing, or resets? User said "Level 4 and 5 is Boss... then next level".
            // Let's keep incrementing wave count linearly, but logic wraps around mod 5.
        }

        setGameState({
            wheat: wheat + reward,
            wave: newWave,
            stage: newStage,
            isWaveActive: false,
            // Show Victory UI or just pause? Pause for now.
        });
    };

    return (
        <group>
            {/* Path Viz (Dirt Road) */}
            <Line
                points={PATH_POINTS}
                color="#78350f" // Dirt Brown
                lineWidth={40}  // Much wider
                position={[0, 0.02, 0]} // Slightly above ground
                opacity={1}
                transparent={false}
            />

            {/* Render Enemies */}
            {enemies.map(enemy => (
                <EnemyRenderer key={enemy.id} enemy={enemy} />
            ))}
        </group>
    );
};

const EnemyRenderer = ({ enemy }: { enemy: Enemy }) => {
    // Size logic moved to Model

    return (
        <group position={enemy.position} rotation={[0, enemy.rotation, 0]}>
            <EnemyModel enemy={enemy} />

            {/* HP Bar */}
            <Html position={[0, (enemy.isBoss ? 2 : 0.8) + 0.5, 0]} center>
                <div className="w-8 h-1 bg-gray-700 rounded overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-200"
                        style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                    />
                </div>
            </Html>
        </group>
    );
};
