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
  galaxyReady,
  targetStarId,
  allStars,
}: { 
  newStarPosition?: [number, number, number];
  showWelcome?: boolean;
  onWelcomeComplete?: () => void;
  galaxyReady: boolean;
  targetStarId?: number | null;
  allStars: any[];
}) {
  const { camera, scene } = useThree();
  const controlsRef = useRef<any>(null);
  const [welcomeAnimated, setWelcomeAnimated] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const cinematicActiveRef = useRef<boolean>(false);
  const shootingStarsRef = useRef<THREE.Points[]>([]);
  
  // Welcome animation - zoom out from first star
  useEffect(() => {
    if (showWelcome && !welcomeAnimated && controlsRef.current && galaxyReady) {
      camera.position.set(5, 3, 8);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      
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
  
  // البحث عن نجمة - انتقال سريع بدون أنميشن انفجار
  useEffect(() => {
    if (targetStarId !== null && targetStarId !== undefined && allStars.length > 0 && controlsRef.current && !showWelcome) {
      const star = allStars.find(s => s.id === targetStarId);
      if (star && star.position) {
        const [x, y, z] = star.position;
        
        const starPos = new THREE.Vector3(x, y, z);
        const offset = new THREE.Vector3(30, 20, 40);
        const cameraTarget = starPos.clone().add(offset);
        
        // تعطيل damping للحركة السلسة
        controlsRef.current.enableDamping = false;
        controlsRef.current.enabled = false;
        
        gsap.to(camera.position, {
          x: cameraTarget.x,
          y: cameraTarget.y,
          z: cameraTarget.z,
          duration: 2.2,
          ease: "power2.out", // حركة أكثر سلاسة
          onUpdate: () => {
            if (controlsRef.current) {
              controlsRef.current.target.set(starPos.x, starPos.y, starPos.z);
              controlsRef.current.update();
            }
          },
          onComplete: () => {
            if (controlsRef.current) {
              controlsRef.current.enableDamping = true;
              controlsRef.current.enabled = true;
            }
          }
        });
      }
    }
  }, [targetStarId, allStars, camera, controlsRef, showWelcome]);
  
  // Cinematic transition to star (للنجوم الجديدة فقط)
  useEffect(() => {
    if (newStarPosition && controlsRef.current && !showWelcome) {
      const [x, y, z] = newStarPosition;
      
      const starPos = new THREE.Vector3(x, y, z);
      const offset = new THREE.Vector3(30, 20, 40);
      const cameraTarget = starPos.clone().add(offset);
      
      // تعطيل damping للحركة السلسة
      controlsRef.current.enableDamping = false;
      controlsRef.current.enabled = false;
      
      gsap.to(camera.position, {
        x: cameraTarget.x,
        y: cameraTarget.y,
        z: cameraTarget.z,
        duration: 2.2,
        ease: "power2.out", // حركة أكثر سلاسة
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.target.set(starPos.x, starPos.y, starPos.z);
            controlsRef.current.update();
          }
        },
        onComplete: () => {
          if (controlsRef.current) {
            controlsRef.current.enableDamping = true;
            controlsRef.current.enabled = true;
          }
        }
      });
    }
  }, [newStarPosition, camera, showWelcome]);
  
  // Reset idle timer on user interaction
  useEffect(() => {
    const resetIdleTimer = () => {
      lastInteractionRef.current = Date.now();
      if (cinematicActiveRef.current) {
        cinematicActiveRef.current = false;
        shootingStarsRef.current.forEach(star => scene.remove(star));
        shootingStarsRef.current = [];
      }
    };
    
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', resetIdleTimer);
    canvas.addEventListener('touchstart', resetIdleTimer);
    canvas.addEventListener('wheel', resetIdleTimer);
    canvas.addEventListener('pointermove', resetIdleTimer);
    
    return () => {
      canvas.removeEventListener('mousedown', resetIdleTimer);
      canvas.removeEventListener('touchstart', resetIdleTimer);
      canvas.removeEventListener('wheel', resetIdleTimer);
      canvas.removeEventListener('pointermove', resetIdleTimer);
    };
  }, [scene]);
  
  // Shooting stars every 5 seconds - ALWAYS active, doesn't stop on interaction
  useEffect(() => {
    if (showWelcome || !galaxyReady) {
      return;
    }
    
    let shootingStarIntervalId: NodeJS.Timeout | null = null;
    
    // Create shooting star with varied directions
    const createShootingStar = () => {
      console.log('⭐ Creating shooting star');
      const trailLength = 18;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(trailLength * 3);
      
      // Get camera direction to spawn star in front of view
      const camPos = camera.position.clone();
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      
      // Spawn star FARTHER in front of camera
      const forwardDistance = 200 + Math.random() * 150;
      const sideOffset = (Math.random() - 0.5) * 80;
      const upOffset = 60 + Math.random() * 40;
      
      const right = new THREE.Vector3();
      right.crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
      
      const startPos = camPos.clone()
        .add(camDir.clone().multiplyScalar(forwardDistance))
        .add(right.clone().multiplyScalar(sideOffset))
        .add(new THREE.Vector3(0, upOffset, 0));
      
      for (let i = 0; i < trailLength; i++) {
        positions[i * 3] = startPos.x;
        positions[i * 3 + 1] = startPos.y;
        positions[i * 3 + 2] = startPos.z;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        color: 0xccddff,
        size: 2.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      
      const shootingStar = new THREE.Points(geometry, material);
      scene.add(shootingStar);
      shootingStarsRef.current.push(shootingStar);
      
      // VARIED DIRECTIONS - sometimes down, sometimes right, sometimes diagonal
      const directionType = Math.floor(Math.random() * 4);
      let direction: THREE.Vector3;
      
      switch(directionType) {
        case 0: // Straight down
          direction = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            -3.5,
            (Math.random() - 0.5) * 0.3
          );
          break;
        case 1: // Diagonal right-down
          direction = new THREE.Vector3(
            2.5 + Math.random() * 0.5,
            -2.0 - Math.random() * 0.5,
            (Math.random() - 0.5) * 0.8
          );
          break;
        case 2: // Diagonal left-down
          direction = new THREE.Vector3(
            -2.5 - Math.random() * 0.5,
            -2.0 - Math.random() * 0.5,
            (Math.random() - 0.5) * 0.8
          );
          break;
        default: // Random diagonal
          direction = new THREE.Vector3(
            (Math.random() - 0.5) * 3.0,
            -2.5 - Math.random() * 1.0,
            (Math.random() - 0.5) * 3.0
          );
      }
      
      direction.normalize();
      
      const speed = 400; // ULTRA FAST!
      const distance = 500;
      const duration = distance / speed;
      
      // Animate trail
      const startTime = Date.now();
      const animateTrail = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (elapsed > duration) {
          scene.remove(shootingStar);
          const idx = shootingStarsRef.current.indexOf(shootingStar);
          if (idx > -1) shootingStarsRef.current.splice(idx, 1);
          return;
        }
        
        const currentPos = startPos.clone().add(direction.clone().multiplyScalar(speed * elapsed));
        const positions = geometry.attributes.position.array as Float32Array;
        
        for (let i = trailLength - 1; i > 0; i--) {
          positions[i * 3] = positions[(i - 1) * 3];
          positions[i * 3 + 1] = positions[(i - 1) * 3 + 1];
          positions[i * 3 + 2] = positions[(i - 1) * 3 + 2];
        }
        
        positions[0] = currentPos.x;
        positions[1] = currentPos.y;
        positions[2] = currentPos.z;
        
        geometry.attributes.position.needsUpdate = true;
        material.opacity = 1 - (elapsed / duration) * 0.5;
        
        requestAnimationFrame(animateTrail);
      };
      
      animateTrail();
    };
    
    // Start immediately and continue every 5 seconds - NO STOP on user interaction
    console.log('✨ Starting continuous shooting stars');
    createShootingStar(); // First one immediately
    
    shootingStarIntervalId = setInterval(() => {
      createShootingStar();
    }, 5000);
    
    return () => {
      if (shootingStarIntervalId) clearInterval(shootingStarIntervalId);
    };
  }, [camera, scene, galaxyReady, showWelcome]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
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
  const [allStars, setAllStars] = useState<any[]>([]);
  
  return (
    <Canvas
      camera={{
        position: [5, 3, 8],
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
        
        <color attach="background" args={['#000510']} />
        <fog attach="fog" args={['#000510', 100, 2000]} />
        
        <Environment 
          preset="night"
          background={false}
          blur={0.9}
        />
        
        <ambientLight intensity={0.15} color="#0a1428" />
        <directionalLight position={[50, 50, 50]} intensity={0.4} color="#4466ff" />
        <pointLight position={[100, 100, 100]} intensity={1.5} color="#6699ff" decay={2} />
        <pointLight position={[-80, 50, -80]} intensity={1.0} color="#3355cc" decay={2} />
        <pointLight position={[0, -100, 50]} intensity={0.6} color="#1a2244" decay={2} />
        
        <BackgroundStars />
        
        <Galaxy 
          onStarClick={onStarClick}
          newStarPosition={newStarPosition}
          refreshTrigger={refreshTrigger}
          targetStarId={targetStarId}
          onReady={() => setGalaxyReady(true)}
          onStarsLoaded={setAllStars}
        />
        
        <ShootingStars />

        <CameraController 
          newStarPosition={newStarPosition}
          showWelcome={showWelcome}
          onWelcomeComplete={onWelcomeComplete}
          galaxyReady={galaxyReady}
          targetStarId={targetStarId}
          allStars={allStars}
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
