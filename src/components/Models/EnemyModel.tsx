import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { type Enemy } from '../../store/gameStore';
import { ENEMY_GEOMETRY, ENEMY_MATERIALS } from './SharedAssets';

interface EnemyModelProps {
    enemy: Enemy;
}

export const EnemyModel = ({ enemy }: EnemyModelProps) => {
    const groupRef = useRef<Group>(null);
    const bodyRef = useRef<Group>(null);

    // Waddle Animation Phase
    const phase = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame((state) => {
        if (bodyRef.current) {
            const t = state.clock.elapsedTime * (enemy.speed * 5) + phase;
            // Waddle rotation (Z axis)
            bodyRef.current.rotation.z = Math.sin(t) * 0.1;
            // Bob up/down
            bodyRef.current.position.y = Math.abs(Math.sin(t * 2)) * 0.05;
        }
    });

    const matColor = enemy.isBoss ? ENEMY_MATERIALS.DARK_RED : ENEMY_MATERIALS.RED;
    const scale = enemy.isBoss ? 2 : 1;

    return (
        <group ref={groupRef} scale={scale}>
            <group ref={bodyRef}>
                {/* Main Body (Hemisphere) */}
                <mesh
                    position={[0, 0.3, 0]}
                    castShadow
                    geometry={ENEMY_GEOMETRY.BODY}
                    material={matColor}
                />

                {/* Head */}
                <mesh
                    position={[0, 0.25, 0.25]}
                    castShadow
                    geometry={ENEMY_GEOMETRY.HEAD}
                    material={ENEMY_MATERIALS.BLACK}
                />

                {/* Eyes */}
                <mesh
                    position={[0.08, 0.3, 0.35]}
                    geometry={ENEMY_GEOMETRY.EYE}
                    material={ENEMY_MATERIALS.EYE}
                />
                <mesh
                    position={[-0.08, 0.3, 0.35]}
                    geometry={ENEMY_GEOMETRY.EYE}
                    material={ENEMY_MATERIALS.EYE}
                />

                {/* Legs (Simple cylinders) */}
                {[1, 0, -1].map((offset, i) => (
                    <group key={i} position={[0, 0.1, offset * 0.15]}>
                        {/* Right Leg */}
                        <mesh
                            position={[0.3, 0, 0]}
                            rotation={[0, 0, -0.5]}
                            geometry={ENEMY_GEOMETRY.LEG}
                            material={ENEMY_MATERIALS.BLACK}
                        />
                        {/* Left Leg */}
                        <mesh
                            position={[-0.3, 0, 0]}
                            rotation={[0, 0, 0.5]}
                            geometry={ENEMY_GEOMETRY.LEG}
                            material={ENEMY_MATERIALS.BLACK}
                        />
                    </group>
                ))}
            </group>
        </group>
    );
}
