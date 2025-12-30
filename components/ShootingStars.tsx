'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ShootingStars() {
  const starsRef = useRef<THREE.Points>(null);
  
  // Create shooting stars
  const { positions, velocities, reset } = useRef({
    positions: new Float32Array(15 * 3), // 5 shooting stars
    velocities: new Float32Array(15 * 3),
    reset: [] as number[]
  }).current;

  // Initialize shooting stars
  useRef(() => {
    for (let i = 0; i < 5; i++) {
      const i3 = i * 3;
      // Random starting position
      positions[i3] = (Math.random() - 0.5) * 400;
      positions[i3 + 1] = (Math.random() - 0.5) * 200 + 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 400;
      
      // Velocity
      velocities[i3] = -2 - Math.random() * 3;
      velocities[i3 + 1] = -1 - Math.random() * 2;
      velocities[i3 + 2] = -1 - Math.random() * 2;
    }
  }).current;

  useFrame(() => {
    if (!starsRef.current) return;
    
    const positions = starsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < 5; i++) {
      const i3 = i * 3;
      
      // Update position
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
      
      // Reset if out of bounds
      if (positions[i3] < -300 || positions[i3 + 1] < -100) {
        positions[i3] = (Math.random() - 0.5) * 400;
        positions[i3 + 1] = 200 + Math.random() * 100;
        positions[i3 + 2] = (Math.random() - 0.5) * 400;
      }
    }
    
    starsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={5}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={3}
        color="#ffffff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
