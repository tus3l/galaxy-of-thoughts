'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

export default function BackgroundStars() {
  const starsGeometry = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    const colors = new Float32Array(2000 * 3);
    
    for (let i = 0; i < 2000; i++) {
      const i3 = i * 3;
      
      // Distribute in a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 800 + Math.random() * 500;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Slight blue-white tint
      const brightness = 0.8 + Math.random() * 0.2;
      colors[i3] = brightness * (0.9 + Math.random() * 0.1);
      colors[i3 + 1] = brightness * (0.95 + Math.random() * 0.05);
      colors[i3 + 2] = brightness;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    return geometry;
  }, []);

  return (
    <points geometry={starsGeometry}>
      <pointsMaterial
        size={0.8}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
