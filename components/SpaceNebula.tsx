'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function SpaceNebula() {
  const nebulaRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <mesh ref={nebulaRef} position={[0, 0, -800]}>
      <planeGeometry args={[1500, 1500]} />
      <meshBasicMaterial
        color="#0a1a3a"
        transparent
        opacity={0.08}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
