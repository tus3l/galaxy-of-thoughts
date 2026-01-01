'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useEffect, useState } from 'react';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import Galaxy from './Galaxy';
import ShootingStars from './ShootingStars';
import BackgroundStars from './BackgroundStars';
import { StarData } from '@/types';

// Component to remove center crosshair only
function CrosshairRemover() {
  const { scene } = useThree();
  const lastCheck = useRef(0);
  
  useFrame((state) => {
    // Check every 200ms
    if (state.clock.elapsedTime - lastCheck.current < 0.2) return;
    lastCheck.current = state.clock.elapsedTime;
    
    scene.traverse((object) => {
      // Only remove Points that have very few vertices (likely a crosshair/gizmo)
      if (object.type === 'Points') {
        const points = object as THREE.Points;
        const geometry = points.geometry;
        
        // Check vertex count - crosshair typically has 1-10 vertices
        // BackgroundStars has 2000, ShootingStars has 15 (but they move)
        const vertexCount = geometry.attributes.position?.count || 0;
        
        // Only remove if it's a small crosshair (less than 10 points) at origin
        if (vertexCount < 10) {
          const pos = object.position;
          if (Math.abs(pos.x) < 0.1 && Math.abs(pos.y) < 0.1 && Math.abs(pos.z) < 0.1) {
            object.visible = false;
            object.parent?.remove(object);
          }
        }
      }
    });
  });
  
  return null;
}

interface SceneProps {
  onStarClick?: (star: StarData) => void;
  newStarPosition?: [number, number, number];
  refreshTrigger?: number;
  targetStarId?: number | null;
  showWelcome?: boolean;
  onWelcomeComplete?: () => void;
}

// Component to update OrbitControls target with GSAP
function CameraController({ 
  newStarPosition, 
  showWelcome, 
  onWelcomeComplete,
  galaxyReady 
}: { 
  newStarPosition?: [number, number, number];
  showWelcome?: boolean;
  onWelcomeComplete?: () => void;
  galaxyReady: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [welcomeAnimated, setWelcomeAnimated] = useState(false);
  
  // Welcome animation - zoom out from first star
  useEffect(() => {
    if (showWelcome && !welcomeAnimated && controlsRef.current && galaxyReady) {
      // ابدأ الكاميرا قريبة جداً من مركز المجرة
      camera.position.set(5, 3, 8);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      
      // انتظر قليلاً ثم ابدأ الـ zoom out
      setTimeout(() => {
        gsap.to(camera.position, {
          x: 150,
          y: 100,
          z: 200,
          duration: 4,
          ease: "power2.out",
          onUpdate: () => {
            controlsRef.current?.update();
          },
          onComplete: () => {
            setWelcomeAnimated(true);
            onWelcomeComplete?.();
          }
        });
        
        gsap.to(controlsRef.current.target, {
          x: 0,
          y: 0,
          z: 0,
          duration: 4,
          ease: "power2.out",
        });
      }, 500);
    }
  }, [showWelcome, welcomeAnimated, camera, onWelcomeComplete, galaxyReady]);
  
  // Cinematic transition to star
  useEffect(() => {
    if (newStarPosition && controlsRef.current && !showWelcome) {
      const [x, y, z] = newStarPosition;
      
      // حساب موقع الكاميرا (بعيد عن النجمة)
      const starPos = new THREE.Vector3(x, y, z);
      const offset = new THREE.Vector3(30, 20, 40);
      const cameraTarget = starPos.clone().add(offset);
      
      // GSAP animation للكاميرا
      gsap.to(camera.position, {
        x: cameraTarget.x,
        y: cameraTarget.y,
        z: cameraTarget.z,
        duration: 2.5,
        ease: "power2.inOut",
        onUpdate: () => {
          controlsRef.current?.update();
        }
      });
      
      // GSAP animation للـ target
      gsap.to(controlsRef.current.target, {
        x: starPos.x,
        y: starPos.y,
        z: starPos.z,
        duration: 2.5,
        ease: "power2.inOut",
      });
    }
  }, [newStarPosition, camera, showWelcome]);
  
  return (
    <OrbitControls
      ref={controlsRef}
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
      panSpeed={0.3}
      makeDefault={false}
      screenSpacePanning={false}
      regress={false}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
    />
  );
}

export default function Scene({ onStarClick, newStarPosition, refreshTrigger, targetStarId, showWelcome, onWelcomeComplete }: SceneProps) {
  const [galaxyReady, setGalaxyReady] = useState(false);
  
  return (
    <Canvas
      camera={{
        position: [5, 3, 8], // ابدأ قريب للرسالة الترحيبية
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
        <CrosshairRemover />
        
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
        
        <Galaxy 
          onStarClick={onStarClick}
          newStarPosition={newStarPosition}
          refreshTrigger={refreshTrigger}
          targetStarId={targetStarId}
          onReady={() => setGalaxyReady(true)}
        />
        
        {/* Shooting stars for beauty */}
        <ShootingStars />

        <CameraController 
          newStarPosition={newStarPosition}
          showWelcome={showWelcome}
          onWelcomeComplete={onWelcomeComplete}
          galaxyReady={galaxyReady}
        />

        <EffectComposer>
          <Bloom
            intensity={2.5}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            radius={0.8}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
