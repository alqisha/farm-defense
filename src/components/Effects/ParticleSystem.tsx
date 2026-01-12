import { create } from 'zustand';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D } from 'three';

// --- Types ---
type EffectType = 'MERGE' | 'HIT' | 'SPAWN';

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
    // We won't store particles in Zustand to avoid re-renders. 
    // Instead we'll use an event emitter pattern or just a simple ref access if possible.
    // Actually, let's use a queue that the component drains.
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
const MAX_PARTICLES = 1000;
const tempObj = new Object3D();

export const ParticleSystem = () => {
    const meshRef = useRef<InstancedMesh>(null);
    const drainQueue = useEffectsStore(state => state.drainQueue);

    // Local state for particles (animation loop only)
    const particles = useRef<Particle[]>([]);

    useFrame((_state, delta) => {
        if (!meshRef.current) return;

        // 1. Spawn new particles
        const newRequests = drainQueue();
        newRequests.forEach(req => {
            const count = req.type === 'MERGE' ? 20 : (req.type === 'HIT' ? 5 : 10);

            for (let i = 0; i < count; i++) {
                if (particles.current.length >= MAX_PARTICLES) break;

                const speed = req.type === 'MERGE' ? 2 : 5;
                // const spread = req.type === 'MERGE' ? 0.5 : 0.2;

                particles.current.push({
                    id: Math.random(),
                    type: req.type,
                    position: [
                        req.position[0] + (Math.random() - 0.5) * 0.2,
                        req.position[1],
                        req.position[2] + (Math.random() - 0.5) * 0.2
                    ],
                    velocity: [
                        (Math.random() - 0.5) * speed,
                        (Math.random() * speed) + (req.type === 'MERGE' ? 2 : 0), // Pop up for merge
                        (Math.random() - 0.5) * speed
                    ],
                    life: 1.0,
                    scale: Math.random() * 0.2 + 0.1,
                    color: req.color || (req.type === 'MERGE' ? '#fbbf24' : '#ef4444')
                });
            }
        });

        // 2. Update & Render
        let activeCount = 0;

        // Filter dead particles (in-place or filter)
        for (let i = particles.current.length - 1; i >= 0; i--) {
            const p = particles.current[i];
            p.life -= delta * 2; // Fade speed

            if (p.life <= 0) {
                particles.current.splice(i, 1);
                continue;
            }

            // Physics
            p.position[0] += p.velocity[0] * delta;
            p.position[1] += p.velocity[1] * delta;
            p.position[2] += p.velocity[2] * delta;

            // Gravity
            p.velocity[1] -= 9.8 * delta;

            // Update Instance
            tempObj.position.set(p.position[0], p.position[1], p.position[2]);
            tempObj.scale.setScalar(p.scale * p.life);
            tempObj.updateMatrix();

            meshRef.current.setMatrixAt(activeCount, tempObj.matrix);
            // Color support requires custom shader or multiple meshes. 
            // For MVP, let's just stick to one color or use instanceColor if we want to be fancy.
            // Let's assume Gold for now for everything, or mix.
            // instanceColor buffer usage is a bit more verbose, skipping for "simple" wow factor. 
            // MERGE is Gold. HIT is keeping simple. Let's just make them glowing Gold/White cubes.

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
            <boxGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
        </instancedMesh>
    );
};
