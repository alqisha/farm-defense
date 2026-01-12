import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { useGameStore } from '../store/gameStore';
import { Line, Html } from '@react-three/drei';
import { useEffectsStore } from './Effects/ParticleSystem';
import { PlantModel } from './Models/PlantModel';
import { SoundManager } from '../components/SoundManager';

interface PlantProps {
    level: number;
    position: [number, number, number]; // Local rendering position
    worldPosition: [number, number, number]; // Actual global position for combat
    isSelected?: boolean;
    onClick?: () => void;
}

const RANGE = 3.5;
const COOLDOWN = 2500; // ms

export const Plant = ({ level, position, worldPosition, isSelected, onClick }: PlantProps) => {
    const meshRef = useRef<Mesh>(null);
    const damageEnemy = useGameStore(state => state.damageEnemy);

    const lastShotTime = useRef(0);
    const [targetPos, setTargetPos] = useState<[number, number, number] | null>(null);

    useFrame((state) => {
        if (!meshRef.current) return;

        // Combat Logic
        const now = state.clock.elapsedTime * 1000;

        // Only search for targets if cooldown is ready
        if (now - lastShotTime.current > (COOLDOWN / level)) {
            const enemies = useGameStore.getState().enemies;

            let nearestDist = Infinity;
            let targetId = null;
            let tPos: [number, number, number] | null = null;

            // USE WORLD POSITION for distance calculation
            const plantPos = new Vector3(...worldPosition);

            for (const enemy of enemies) {
                const ePos = new Vector3(...enemy.position);
                const dist = plantPos.distanceTo(ePos);

                if (dist < RANGE && dist < nearestDist) {
                    nearestDist = dist;
                    targetId = enemy.id;
                    tPos = enemy.position;
                }
            }

            if (targetId && tPos) {
                // SHOOT
                damageEnemy(targetId, 5 * level);
                SoundManager.playShoot();

                // Trigger Effect
                useEffectsStore.getState().triggerEffect('HIT', tPos);

                lastShotTime.current = now;
                setTargetPos(tPos);

                // Clear visual after 100ms
                setTimeout(() => setTargetPos(null), 100);
            }
        }
    });

    const colors = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d']; // Levels 1-5
    const color = colors[Math.min(level - 1, colors.length - 1)];

    return (
        <group position={position}>
            {/* Hitbox/Interaction Mesh (Invisible) */}
            <mesh
                ref={meshRef}
                onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                visible={false}
            >
                <boxGeometry args={[1, 1, 1]} />
            </mesh>

            <group onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                <PlantModel level={level} color={color} />

                {/* Level Text (Floating) */}
                <Html position={[0, 1.2, 0]} center pointerEvents="none">
                    <div className="text-white font-black text-xs bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/20 shadow-sm whitespace-nowrap select-none">
                        Lvl {level}
                    </div>
                </Html>

                {/* Selection Ring */}
                {isSelected && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                        <ringGeometry args={[0.4, 0.5, 32]} />
                        <meshBasicMaterial color="yellow" />
                    </mesh>
                )}
            </group>

            {/* Laser/Projectile Viz */}
            {targetPos && (
                <Line
                    points={[[0, 0, 0], [targetPos[0] - position[0], targetPos[1] - position[1], targetPos[2] - position[2]]]}
                    color="yellow"
                    lineWidth={0.2 * level}
                    transparent
                    opacity={0.8}
                />
            )}
        </group>
    );
};
