'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import Galaxy from './Galaxy';
import { StarData } from '@/types';

interface SceneProps {
  onStarClick?: (star: StarData) => void;
}

export default function Scene({ onStarClick }: SceneProps) {
  return (
    <Canvas
      camera={{
        position: [0, 0, 50],
        fov: 75,
      }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      style={{ touchAction: 'none' }}
    >
      <Suspense fallback={null}>
        {/* HDR Environment - Local file in public folder */}
        <Environment 
          files="/space.hdr"
          background 
          blur={0.1}
          backgroundIntensity={0.4}
        />
        
        {/* Enhanced lighting for space atmosphere */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.6} color="#a0b4ff" />
        
        <Galaxy starCount={800} onStarClick={onStarClick} />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          enableZoom={true}
          zoomSpeed={0.8}
          minDistance={20}
          maxDistance={2000}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
          }}
          enablePan={true}
          panSpeed={0.5}
        />

        <EffectComposer>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.9}
            radius={0.3}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
