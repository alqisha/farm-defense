import { create } from 'zustand';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D } from 'three';

// --- Types ---
type EffectType = 'MERGE' | 'HIT' | 'SPAWN' | 'DEATH' | 'LEVELUP';

interface Particle {
    id: number;
    type: EffectType;
    position: [number, number, number];
    velocity: [number, number, number];
    life: number; // 0 to 1
    scale: number;
    color: string;
}

interface EffectsState {
    triggerEffect: (type: EffectType, position: [number, number, number], color?: string) => void;
    queue: ParticleRequest[];
    drainQueue: () => ParticleRequest[];
}

interface ParticleRequest {
    type: EffectType;
    position: [number, number, number];
    color?: string;
}

export const useEffectsStore = create<EffectsState>((set, get) => ({
    queue: [],
    triggerEffect: (type, position, color) => {
        set(state => ({ queue: [...state.queue, { type, position, color }] }));
    },
    drainQueue: () => {
        const { queue } = get();
        if (queue.length === 0) return [];
        set({ queue: [] });
        return queue;
    }
}));

// --- Component ---
const MAX_PARTICLES = 1500;
const tempObj = new Object3D();

export const ParticleSystem = () => {
    const meshRef = useRef<InstancedMesh>(null);
    const drainQueue = useEffectsStore(state => state.drainQueue);
    const particles = useRef<Particle[]>([]);

    useFrame((_state, delta) => {
        if (!meshRef.current) return;

        // 1. Spawn new particles
        const newRequests = drainQueue();
        newRequests.forEach(req => {
            let count = 10;
            let speed = 5;
            let life = 1.0;
            let baseColor = '#fbbf24';

            if (req.type === 'MERGE') { count = 20; speed = 3; baseColor = '#fbbf24'; }
            else if (req.type === 'HIT') { count = 3; speed = 4; life = 0.5; baseColor = '#ef4444'; }
            else if (req.type === 'DEATH') { count = 30; speed = 6; life = 1.2; baseColor = '#dc2626'; }
            else if (req.type === 'LEVELUP') { count = 100; speed = 8; life = 2.0; baseColor = '#ffd700'; }

            for (let i = 0; i < count; i++) {
                if (particles.current.length >= MAX_PARTICLES) break;

                const color = req.color || baseColor;

                particles.current.push({
                    id: Math.random(),
                    type: req.type,
                    position: [
                        req.position[0],
                        req.position[1],
                        req.position[2]
                    ],
                    velocity: [
                        (Math.random() - 0.5) * speed,
                        (Math.random() * speed) + (req.type === 'LEVELUP' ? 5 : 2),
                        (Math.random() - 0.5) * speed
                    ],
                    life: life,
                    scale: Math.random() * 0.2 + 0.1,
                    color: color
                });
            }
        });

        // 2. Update & Render
        let activeCount = 0;

        for (let i = particles.current.length - 1; i >= 0; i--) {
            const p = particles.current[i];
            p.life -= delta * (p.type === 'LEVELUP' ? 0.5 : 2); // Slower fade for levelup

            if (p.life <= 0) {
                particles.current.splice(i, 1);
                continue;
            }

            // Physics
            p.position[0] += p.velocity[0] * delta;
            p.position[1] += p.velocity[1] * delta;
            p.position[2] += p.velocity[2] * delta;

            p.velocity[1] -= 15 * delta; // Gravity

            // Bounce floor
            if (p.position[1] < 0) {
                p.position[1] = 0;
                p.velocity[1] *= -0.5;
            }

            tempObj.position.set(p.position[0], p.position[1], p.position[2]);
            tempObj.scale.setScalar(p.scale * p.life);
            tempObj.updateMatrix();

            meshRef.current.setMatrixAt(activeCount, tempObj.matrix);

            // Note: Single material color used for MVP. 
            // In a real app we'd use setColorAt with instanceColor or different meshes/materials.
            // For now, they are all Gold/White-ish.

            activeCount++;
        }

        meshRef.current.count = activeCount;
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, MAX_PARTICLES]}
            frustumCulled={false}
        >
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} transparent opacity={0.9} />
        </instancedMesh>
    );
};
