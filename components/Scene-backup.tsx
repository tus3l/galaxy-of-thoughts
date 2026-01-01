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
  allStars
}: { 
  newStarPosition?: [number, number, number];
  showWelcome?: boolean;
  onWelcomeComplete?: () => void;
  galaxyReady: boolean;
  allStars: any[];
}) {
  const { camera, scene } = useThree();
  const controlsRef = useRef<any>(null);
  const [welcomeAnimated, setWelcomeAnimated] = useState(false);
  const idleTimerRef = useRef<number>(0);
  const lastInteractionRef = useRef<number>(Date.now());
  const cinematicActiveRef = useRef<boolean>(false);
  const cinematicTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const shootingStarsRef = useRef<THREE.Points[]>([]);
  
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
  
  // Reset idle timer on user interaction
  useEffect(() => {
    const resetIdleTimer = () => {
      lastInteractionRef.current = Date.now();
      console.log('👆 User interaction - resetting idle timer');
      if (cinematicActiveRef.current) {
        // Stop cinematic mode when user interacts
        cinematicTimelineRef.current?.kill();
        cinematicActiveRef.current = false;
        // Clean up shooting stars
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
  
  // Cinematic idle camera movement
  useEffect(() => {
    if (showWelcome || !galaxyReady || allStars.length === 0) {
      return;
    }
    
    lastInteractionRef.current = Date.now();
    let currentTimelineRef: gsap.core.Timeline | null = null;
    let shootingStarIntervalId: NodeJS.Timeout | null = null;
    
    const checkIdle = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
      
      if (timeSinceLastInteraction > 5000 && !cinematicActiveRef.current) {
        console.log('🎬 Starting cinematic mode');
        cinematicActiveRef.current = true;
        startCinematicMode();
      }
    }, 500);
    
    // Function to generate safe path points
    const generatePathPoints = (startPos: THREE.Vector3, count: number = 5) => {
      const pathPoints: THREE.Vector3[] = [startPos.clone()];
      
      for (let i = 0; i < count; i++) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        let safePosFound = false;
        let attempts = 0;
        
        while (!safePosFound && attempts < 20) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 35 + Math.random() * 25; // 35-60 units
          const elevation = (Math.random() - 0.5) * 30;
          
          const newPos = new THREE.Vector3(
            lastPoint.x + Math.cos(angle) * distance,
            lastPoint.y + elevation,
            lastPoint.z + Math.sin(angle) * distance
          );
          
          let minDistance = Infinity;
          allStars.forEach((star: any) => {
            const starPos = new THREE.Vector3(...star.position);
            minDistance = Math.min(minDistance, newPos.distanceTo(starPos));
          });
          
          if (minDistance > 25) {
            pathPoints.push(newPos);
            safePosFound = true;
          }
          attempts++;
        }
      }
      
      return pathPoints;
    };
    
    // Create timeline for path navigation
    const createPathTimeline = (pathPoints: THREE.Vector3[]) => {
      const timeline = gsap.timeline();
      
      pathPoints.forEach((point, index) => {
        if (index === 0) return;
        
        // Check if point is behind camera
        const camDir = camera.getWorldDirection(new THREE.Vector3());
        const toPoint = point.clone().sub(camera.position).normalize();
        const dot = camDir.dot(toPoint);
        
        // If behind (dot < 0), rotate slowly first
        if (dot < 0) {
          timeline.to(controlsRef.current.target, {
            x: point.x,
            y: point.y,
            z: point.z,
            duration: 3, // Slow rotation
            ease: "sine.inOut"
          });
          timeline.to({}, { duration: 1 }); // 1 second pause
        }
        
        // Move to point - VERY SLOW (45s)
        timeline.to(camera.position, {
          x: point.x,
          y: point.y,
          z: point.z,
          duration: 45,
          ease: "sine.inOut",
          onUpdate: () => controlsRef.current?.update()
        });
        
        // Move target simultaneously
        timeline.to(controlsRef.current.target, {
          x: point.x + (Math.random() - 0.5) * 8,
          y: point.y + (Math.random() - 0.5) * 6,
          z: point.z + (Math.random() - 0.5) * 8,
          duration: 45,
          ease: "sine.inOut"
        }, '<');
        
        // 3 second pause between points
        timeline.to({}, { duration: 3 });
      });
      
      return timeline;
    };
    
    // Create shooting star with callback
    const createShootingStar = (onComplete: () => void) => {
      console.log('✨ Shooting star spawning...');
      const trailLength = 12;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(trailLength * 3);
      
      const camPos = camera.position.clone();
      const startPos = new THREE.Vector3(
        camPos.x + (Math.random() - 0.5) * 80,
        camPos.y + 50 + Math.random() * 30,
        camPos.z + (Math.random() - 0.5) * 80
      );
      
      for (let i = 0; i < trailLength; i++) {
        positions[i * 3] = startPos.x;
        positions[i * 3 + 1] = startPos.y;
        positions[i * 3 + 2] = startPos.z;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 4,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
      });
      
      const shootingStar = new THREE.Points(geometry, material);
      scene.add(shootingStar);
      shootingStarsRef.current.push(shootingStar);
      
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        -2.5 - Math.random() * 0.5,
        (Math.random() - 0.5) * 1.2
      ).normalize();
      
      const speed = 70;
      const distance = 180;
      const duration = distance / speed;
      
      // Follow shooting star
      gsap.to(camera.position, {
        x: startPos.x + direction.x * 50,
        y: startPos.y + direction.y * 30,
        z: startPos.z + direction.z * 50,
        duration: duration * 0.8,
        ease: "power2.out",
        onUpdate: () => controlsRef.current?.update()
      });
      
      gsap.to(controlsRef.current.target, {
        x: startPos.x + direction.x * 80,
        y: startPos.y + direction.y * 80,
        z: startPos.z + direction.z * 80,
        duration: duration * 0.8,
        ease: "power2.out"
      });
      
      // Animate trail
      const startTime = Date.now();
      const animateTrail = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (elapsed > duration) {
          scene.remove(shootingStar);
          const idx = shootingStarsRef.current.indexOf(shootingStar);
          if (idx > -1) shootingStarsRef.current.splice(idx, 1);
          
          // Wait 1 second then call onComplete
          setTimeout(onComplete, 1000);
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
        material.opacity = 1 - (elapsed / duration) * 0.7;
        
        requestAnimationFrame(animateTrail);
      };
      
      animateTrail();
    };
    
    // Start cinematic mode
    const startCinematicMode = () => {
      console.log('🎬 Generating initial path...');
      const initialPoints = generatePathPoints(camera.position.clone(), 5);
      currentTimelineRef = createPathTimeline(initialPoints);
      cinematicTimelineRef.current = currentTimelineRef;
      
      // First shooting star after 15 seconds, then every 20 seconds
      setTimeout(() => {
        console.log('⭐ Creating first shooting star');
        createShootingStar(() => {
          const newPoints = generatePathPoints(camera.position.clone(), 5);
          currentTimelineRef = createPathTimeline(newPoints);
          cinematicTimelineRef.current = currentTimelineRef;
        });
        
        // Shooting star every 20 seconds after first one
        shootingStarIntervalId = setInterval(() => {
          if (!cinematicActiveRef.current) {
            if (shootingStarIntervalId) clearInterval(shootingStarIntervalId);
            return;
          }
          
          console.log('⭐ Creating shooting star');
          currentTimelineRef?.pause();
          
          createShootingStar(() => {
            const newPoints = generatePathPoints(camera.position.clone(), 5);
            currentTimelineRef = createPathTimeline(newPoints);
            cinematicTimelineRef.current = currentTimelineRef;
          });
        }, 20000);
      }, 15000);
    };
    
    return () => {
      clearInterval(checkIdle);
      if (shootingStarIntervalId) clearInterval(shootingStarIntervalId);
      currentTimelineRef?.kill();
      cinematicTimelineRef.current?.kill();
    };
  }, [camera, scene, galaxyReady, showWelcome, allStars.length]);
  
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
  const [allStars, setAllStars] = useState<any[]>([]);
  
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
          onStarsLoaded={setAllStars}
        />
        
        {/* Shooting stars for beauty */}
        <ShootingStars />

        <CameraController 
          newStarPosition={newStarPosition}
          showWelcome={showWelcome}
          onWelcomeComplete={onWelcomeComplete}
          galaxyReady={galaxyReady}
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
