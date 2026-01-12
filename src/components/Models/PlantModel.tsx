import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { PLANT_GEOMETRY, PLANT_MATERIALS } from './SharedAssets';

interface PlantModelProps {
    level: number;
    color: string;
}

export const PlantModel = ({ level, color }: PlantModelProps) => {
    const groupRef = useRef<Group>(null);
    const leafRef = useRef<Group>(null);

    // Randomize initial sway phase so they don't sync
    const phase = useMemo(() => Math.random() * Math.PI, []);

    useFrame((state) => {
        if (!groupRef.current) return;

        // Sway animation
        const t = state.clock.elapsedTime + phase;
        groupRef.current.rotation.z = Math.sin(t * 2) * 0.05;

        if (leafRef.current) {
            leafRef.current.rotation.y = Math.sin(t * 1.5) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Stem */}
            <mesh
                position={[0, 0.3, 0]}
                castShadow
                receiveShadow
                geometry={PLANT_GEOMETRY.STEM}
                material={PLANT_MATERIALS.GREEN}
            />

            {/* Leaves */}
            <group ref={leafRef} position={[0, 0.2, 0]}>
                <mesh
                    position={[0.2, 0, 0]}
                    rotation={[0, 0, -0.5]}
                    geometry={PLANT_GEOMETRY.LEAF}
                    material={PLANT_MATERIALS.GREEN}
                />
                <mesh
                    position={[-0.2, 0, 0]}
                    rotation={[0, 0, 0.5]}
                    geometry={PLANT_GEOMETRY.LEAF}
                    material={PLANT_MATERIALS.GREEN}
                />

                {level > 1 && (
                    <>
                        <mesh
                            position={[0, 0, 0.2]}
                            rotation={[0.5, 0, 0]}
                            geometry={PLANT_GEOMETRY.LEAF}
                            material={PLANT_MATERIALS.GREEN}
                        />
                        <mesh
                            position={[0, 0, -0.2]}
                            rotation={[-0.5, 0, 0]}
                            geometry={PLANT_GEOMETRY.LEAF}
                            material={PLANT_MATERIALS.GREEN}
                        />
                    </>
                )}
            </group>

            {/* Head / Shooter (Scale based on level) */}
            <group position={[0, 0.6, 0]} scale={0.8 + (level * 0.1)}>
                {/* Petals / Main Head */}
                <mesh castShadow geometry={PLANT_GEOMETRY.HEAD_MAIN}>
                    <meshStandardMaterial color={color} />
                </mesh>

                {/* Snout/Cannon */}
                <mesh
                    position={[0, 0, 0.2]}
                    rotation={[Math.PI / 2, 0, 0]}
                    geometry={PLANT_GEOMETRY.HEAD_SNOUT}
                >
                    <meshStandardMaterial color={color} />
                </mesh>

                {/* Dark Hole */}
                <mesh
                    position={[0, 0, 0.35]}
                    rotation={[Math.PI / 2, 0, 0]}
                    geometry={PLANT_GEOMETRY.HEAD_HOLE}
                    material={PLANT_MATERIALS.BLACK}
                />
            </group>

        </group>
    );
}
