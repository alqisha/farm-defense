import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Plant } from './Plant';
import { useEffectsStore } from './Effects/ParticleSystem';
import { SoundManager } from './SoundManager';

const GRID_SIZE = 5;
const TILE_SIZE = 1.2;

export const FarmGrid = () => {
    const { plants, addPlant, selectedPlantId, selectPlant, movePlant, mergePlants } = useGameStore();
    const [hoveredTile, setHoveredTile] = useState<number | null>(null);

    const handleTileClick = (index: number) => {
        // If we have a selected plant
        if (selectedPlantId) {
            const selectedPlant = plants.find(p => p.id === selectedPlantId);
            if (!selectedPlant) return;

            // If clicked on same tile, deselect
            if (selectedPlant.gridIndex === index) {
                selectPlant(null);
                return;
            }

            // Check if target tile has a plant
            const targetPlant = plants.find(p => p.gridIndex === index);
            if (targetPlant) {
                // MERGE LOGIC
                if (targetPlant.level === selectedPlant.level) {

                    // Calc position for effect
                    const row = Math.floor(index / GRID_SIZE);
                    const col = index % GRID_SIZE;
                    const offset = ((GRID_SIZE - 1) * TILE_SIZE) / 2;
                    const x = col * TILE_SIZE - offset;
                    const z = row * TILE_SIZE - offset;

                    useEffectsStore.getState().triggerEffect('MERGE', [x, 0.5, z]);
                    SoundManager.playMerge();
                    mergePlants(selectedPlant.id, targetPlant.id);
                    selectPlant(null);
                } else {
                    // Swap or just change selection? For now change selection
                    selectPlant(targetPlant.id);
                }
            } else {
                // MOVE LOGIC
                movePlant(selectedPlant.id, index);
                selectPlant(null);
            }
        } else {
            // No selection: Try to buy/place or select existing
            const plant = plants.find(p => p.gridIndex === index);
            if (plant) {
                selectPlant(plant.id);
            } else {
                // Buy new plant (Mock logic for now)
                addPlant(index);
            }
        }
    };

    // Generate grid tiles
    const tiles = [];
    const offset = ((GRID_SIZE - 1) * TILE_SIZE) / 2;

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        const x = col * TILE_SIZE - offset;
        const z = row * TILE_SIZE - offset;

        const plant = plants.find(p => p.gridIndex === i);
        const isSelected = plant?.id === selectedPlantId;

        tiles.push(
            <group key={i} position={[x, 0, z]}>
                {/* Tile Mesh */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    receiveShadow
                    onClick={(e) => { e.stopPropagation(); handleTileClick(i); }}
                    onPointerOver={() => setHoveredTile(i)}
                    onPointerOut={() => setHoveredTile(null)}
                >
                    <planeGeometry args={[1, 1]} />
                    <meshStandardMaterial
                        color={hoveredTile === i ? "#fbbf24" : ((row + col) % 2 === 0 ? "#4ade80" : "#22c55e")}
                    />
                </mesh>

                {/* Render Plant if exists */}
                {plant && (
                    <Plant
                        level={plant.level}
                        position={[0, 0.5, 0]}
                        worldPosition={[x, 0.55, z]} // Passed for accurate combat calcs
                        isSelected={isSelected}
                        onClick={() => handleTileClick(i)} // Delegate to tile handler
                    />
                )}
            </group>
        );
    }

    return (
        <group position={[0, 0.05, 0]}>
            {tiles}
        </group>
    );
};
