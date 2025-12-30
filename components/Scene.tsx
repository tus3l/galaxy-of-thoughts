'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import Galaxy from './Galaxy';
import ShootingStars from './ShootingStars';
import BackgroundStars from './BackgroundStars';
import { StarData } from '@/types';

function SceneCleaner() {
  const { scene, gl } = useThree();
  
  useEffect(() => {
    const cleanup = () => {
      scene.traverse((object) => {
        // Aggressively remove Points objects (the center box)
        if (object.type === 'Points') {
          object.visible = false;
          if (object.parent) {
            object.parent.remove(object);
          }
        }
        
        // Remove any Sprite, Line near center
        if (
          object.type === 'Sprite' ||
          object.type === 'Line' ||
          object.type === 'LineSegments' ||
          object.type === 'LineLoop'
        ) {
          if (object.position.length() < 50) {
            object.visible = false;
            object.parent?.remove(object);
          }
        }
        
        // Remove any Mesh with BoxGeometry or PlaneGeometry near center
        if (object.type === 'Mesh') {
          const mesh = object as THREE.Mesh;
          if (
            mesh.geometry?.type === 'BoxGeometry' ||
            mesh.geometry?.type === 'PlaneGeometry' ||
            mesh.geometry?.type === 'PlaneBufferGeometry'
          ) {
            if (mesh.position.length() < 100) {
              mesh.visible = false;
              mesh.parent?.remove(mesh);
            }
          }
        }
        
        // Remove all helpers and controls
        if (
          (object as any).isHelper ||
          object.type.includes('Helper') ||
          object.type.includes('Gizmo') ||
          object.type.includes('Control')
        ) {
          object.visible = false;
          object.parent?.remove(object);
        }
      });
      
      // Force cursor
      const canvas = gl.domElement;
      if (canvas) {
        canvas.style.cursor = 'grab';
      }
    };
    
    // Run immediately and very frequently
    cleanup();
    const interval = setInterval(cleanup, 100); // Very fast cleanup
    
    return () => clearInterval(interval);
  }, [scene, gl]);
  
  return null;
}

interface SceneProps {
  onStarClick?: (star: StarData) => void;
}

export default function Scene({ onStarClick }: SceneProps) {
  // موقع عشوائي للكاميرا عند البداية
  const randomX = (Math.random() - 0.5) * 400;
  const randomY = (Math.random() - 0.5) * 400;
  const randomZ = 50 + Math.random() * 150;
  
  return (
    <Canvas
      camera={{
        position: [randomX, randomY, randomZ],
        fov: 75,
      }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ touchAction: 'none' }}
    >
      <Suspense fallback={null}>
        <SceneCleaner />
        
        {/* Deep Space Environment */}
        <color attach="background" args={['#000510']} />
        <fog attach="fog" args={['#000510', 100, 2000]} />
        
        <Environment 
          preset="night"
          background={false}
          blur={0.9}
        />
        
        {/* Cinematic Space Lighting */}
        <ambientLight intensity={0.15} color="#0a1428" />
        <directionalLight position={[50, 50, 50]} intensity={0.4} color="#4466ff" />
        <pointLight position={[100, 100, 100]} intensity={1.5} color="#6699ff" decay={2} />
        <pointLight position={[-80, 50, -80]} intensity={1.0} color="#3355cc" decay={2} />
        <pointLight position={[0, -100, 50]} intensity={0.6} color="#1a2244" decay={2} />
        
        {/* Background stars for depth */}
        <BackgroundStars />
        
        <Galaxy starCount={800} onStarClick={onStarClick} />
        
        {/* Shooting stars for beauty */}
        <ShootingStars />

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
          enablePan={false}
          panSpeed={0.5}
          makeDefault={false}
          screenSpacePanning={false}
          target={[0, 0, 0]}
          regress={false}
        />

        <EffectComposer>
          <Bloom
            intensity={0.6}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.9}
            radius={0.6}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
