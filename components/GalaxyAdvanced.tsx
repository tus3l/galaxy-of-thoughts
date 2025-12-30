'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Star data type
interface StarData {
  position: [number, number, number];
  color: THREE.Color;
  scale: number;
  speed: number;
  message?: string;
  id?: number;
}

// Generate dummy star data for testing
function generateStarData(count: number): StarData[] {
  const stars: StarData[] = [];
  const colors = {
    blue: new THREE.Color('#3b82f6'),    // Dreams
    red: new THREE.Color('#ef4444'),     // Secrets
    gold: new THREE.Color('#fbbf24'),    // Advice
    purple: new THREE.Color('#a855f7'),  // Wishes
    pink: new THREE.Color('#ec4899'),    // Love
    green: new THREE.Color('#10b981'),   // Hope
    cyan: new THREE.Color('#06b6d4'),    // Thoughts
    white: new THREE.Color('#f8fafc'),   // Pure
  };

  const colorKeys = Object.keys(colors) as Array<keyof typeof colors>;
  const messages = [
    "Chase your dreams fearlessly",
    "The universe is listening",
    "Every moment is a fresh beginning",
    "You are made of stardust",
    "Believe in the magic within you",
    "Love is the answer",
    "Trust the timing of your life",
    "Your story is still being written",
  ];

  for (let i = 0; i < count; i++) {
    // Spherical distribution with galaxy-like clustering
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    // Create spiral galaxy effect
    const spiralFactor = i / count;
    const spiralAngle = spiralFactor * Math.PI * 4;
    const radius = 30 + spiralFactor * 120 + (Math.random() - 0.5) * 20;

    const x = radius * Math.sin(phi) * Math.cos(theta + spiralAngle);
    const y = (Math.random() - 0.5) * 80; // Flatten to disk
    const z = radius * Math.sin(phi) * Math.sin(theta + spiralAngle);

    const colorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    
    stars.push({
      position: [x, y, z],
      color: colors[colorKey],
      scale: 0.3 + Math.random() * 1.2,
      speed: 0.5 + Math.random() * 1.5,
      message: messages[Math.floor(Math.random() * messages.length)],
      id: i,
    });
  }

  return stars;
}

export default function GalaxyAdvanced() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const originalScalesRef = useRef<Float32Array>();
  
  // Generate star data (5000 stars)
  const starData = useMemo(() => generateStarData(5000), []);
  
  // Store original scales
  useEffect(() => {
    originalScalesRef.current = new Float32Array(starData.map(s => s.scale));
  }, [starData]);
  
  // Setup instanced mesh matrices
  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();

    starData.forEach((star, i) => {
      dummy.position.set(...star.position);
      dummy.scale.setScalar(star.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, star.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [starData]);

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current || !originalScalesRef.current) return;

    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    starData.forEach((star, i) => {
      dummy.position.set(...star.position);
      
      // Pulsation
      const pulsate = 1 + Math.sin(time * star.speed + i * 0.1) * 0.15;
      
      // Hover effect - smooth scale transition
      const targetScale = i === hovered 
        ? originalScalesRef.current![i] * 2.5 
        : originalScalesRef.current![i];
      
      dummy.scale.setScalar(targetScale * pulsate);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Interaction handlers
  const handleClick = (event: any) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    if (instanceId !== undefined) {
      console.log('✨ Clicked star:', starData[instanceId]);
      // TODO: Phase 3 - Camera animation & message overlay
    }
  };

  const handlePointerMove = (event: any) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    setHovered(instanceId !== undefined ? instanceId : null);
    document.body.style.cursor = instanceId !== undefined ? 'pointer' : 'grab';
  };

  const handlePointerOut = () => {
    setHovered(null);
    document.body.style.cursor = 'grab';
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, starData.length]}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial
        toneMapped={false}
        transparent
      />
    </instancedMesh>
  );
}
