import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Suspense } from 'react';

import { FarmGrid } from './FarmGrid';
import { EnemySystem } from './EnemySystem';

import { ParticleSystem } from './Effects/ParticleSystem';

export const GameScene = () => {
    return (
        <div className="w-full h-screen bg-gray-900">
            <Canvas shadows>
                <Suspense fallback={null}>
                    {/* Fixed Isometric Camera (Steeper for better clicking) */}
                    <PerspectiveCamera makeDefault position={[0, 20, 10]} fov={35} />
                    <OrbitControls
                        enableRotate={false}
                        enableZoom={true}
                        minZoom={10}
                        maxZoom={30}
                        minPolarAngle={Math.PI / 4} // Allow slightly more range or fix it better
                        maxPolarAngle={Math.PI / 2.5}
                    />

                    <ambientLight intensity={0.8} />
                    <directionalLight
                        position={[10, 20, 5]}
                        intensity={1.2}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                    />

                    {/* Environment/Skybox */}
                    <Environment preset="sunset" background blur={0.5} />

                    {/* Farm Grid */}
                    <FarmGrid />

                    {/* Enemy System */}
                    <EnemySystem />

                    {/* Visual Effects */}
                    <ParticleSystem />

                    {/* Environment Decor */}
                    <group>
                        {/* Fence / Border */}
                        <mesh position={[0, -0.4, -6]} receiveShadow>
                            <boxGeometry args={[12, 1, 0.5]} />
                            <meshStandardMaterial color="#78350f" />
                        </mesh>
                        <mesh position={[0, -0.4, 6]} receiveShadow>
                            <boxGeometry args={[12, 1, 0.5]} />
                            <meshStandardMaterial color="#78350f" />
                        </mesh>

                        {/* Simple Bushes */}
                        {[-7, 7].map((x) => (
                            [-5, 0, 5].map((z) => (
                                <mesh key={`${x}-${z}`} position={[x, 0, z]} castShadow>
                                    <sphereGeometry args={[1, 8, 8]} />
                                    <meshStandardMaterial color="#166534" />
                                </mesh>
                            ))
                        ))}
                    </group>

                    {/* Base Ground (Grass) */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
                        <planeGeometry args={[20, 20]} />
                        <meshStandardMaterial color="#14532d" />
                    </mesh>

                </Suspense>
            </Canvas>
        </div>
    );
};
