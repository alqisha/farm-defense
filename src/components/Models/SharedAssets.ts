import { CylinderGeometry, SphereGeometry, CircleGeometry, MeshStandardMaterial } from 'three';

// -- PLANTS --
export const PLANT_GEOMETRY = {
    STEM: new CylinderGeometry(0.05, 0.06, 0.6, 8),
    LEAF: new SphereGeometry(0.15, 0.05, 0.1),
    HEAD_MAIN: new SphereGeometry(0.25, 16, 16),
    HEAD_SNOUT: new CylinderGeometry(0.1, 0.15, 0.3, 8),
    HEAD_HOLE: new CircleGeometry(0.08, 16)
};

export const PLANT_MATERIALS = {
    GREEN: new MeshStandardMaterial({ color: "#65a30d" }),
    BLACK: new MeshStandardMaterial({ color: "black" }),
    // Colors for heads are dynamic, so we might reuse base materials or clone
};


// -- ENEMIES --
export const ENEMY_GEOMETRY = {
    BODY: new SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    HEAD: new SphereGeometry(0.15, 16, 16),
    EYE: new SphereGeometry(0.04, 8, 8),
    LEG: new CylinderGeometry(0.02, 0.02, 0.4)
};

export const ENEMY_MATERIALS = {
    BLACK: new MeshStandardMaterial({ color: "black" }),
    EYE: new MeshStandardMaterial({ color: "yellow", emissive: "yellow", emissiveIntensity: 0.5 }),
    RED: new MeshStandardMaterial({ color: "#ef4444" }),
    DARK_RED: new MeshStandardMaterial({ color: "#7f1d1d" })
};
