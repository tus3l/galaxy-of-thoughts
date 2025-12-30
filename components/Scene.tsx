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
  const { scene, gl, camera } = useThree();
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Remove any unwanted objects
      scene.traverse((object) => {
        // Check if it's a helper or unwanted mesh
        if (
          object.type === 'GridHelper' ||
          object.type === 'AxesHelper' ||
          object.type === 'CameraHelper' ||
          object.type === 'BoxHelper' ||
          object.type === 'Box3Helper' ||
          object.type === 'ArrowHelper' ||
          object.type === 'PlaneHelper' ||
          object.type === 'SkeletonHelper' ||
          (object as any).isTransformControls ||
          (object as any).isHelper
        ) {
          object.visible = false;
          object.parent?.remove(object);
        }
        
        // Remove any Box or Plane that's not part of our scene
        if (object.type === 'Mesh') {
          const mesh = object as THREE.Mesh;
          const geometry = mesh.geometry;
          
          // Check if it's a small box/plane that might be a gizmo
          if (geometry.type === 'BoxGeometry' || geometry.type === 'PlaneGeometry') {
            const boundingBox = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            
            // If it's a small box near center (likely a gizmo)
            if (size.length() < 10 && mesh.position.length() < 50) {
              mesh.visible = false;
              mesh.parent?.remove(mesh);
            }
          }
        }
      });
      
      // Force cursor style
      gl.domElement.style.cursor = 'grab';
      document.body.style.cursor = 'default';
    }, 100);
    
    return () => clearInterval(interval);
  }, [scene, gl, camera]);
  
  return null;
}

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
          enablePan={true}
          panSpeed={0.5}
          makeDefault={false}
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
