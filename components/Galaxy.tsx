'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GalaxyProps, StarData } from '@/types';
import { generateStarData } from '@/lib/utils';

export default function Galaxy({ starCount = 2000, starData: providedData, onStarClick, onStarHover }: GalaxyProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const originalScalesRef = useRef<Float32Array>();
  const visibleStarsRef = useRef<number[]>([]);
  const { camera } = useThree();
  
  // Generate large pool of stars for infinite world
  const allStars = useMemo(() => 
    providedData || generateStarData(starCount), 
    [providedData, starCount]
  );
  
  // Show closest 100 stars (increased for better experience)
  const maxVisibleStars = 100;
  
  // Store original scales
  useEffect(() => {
    originalScalesRef.current = new Float32Array(allStars.map(s => s.scale));
  }, [allStars]);
  
  // Initial setup - hide all stars
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    dummy.scale.setScalar(0); // Hide initially
    
    for (let i = 0; i < maxVisibleStars; i++) {
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // Dynamic culling - show 100 stars in camera view
  useFrame((state) => {
    if (!meshRef.current || !originalScalesRef.current) return;

    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    const cameraPos = camera.position;
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);

    // Calculate both distance and angle to camera direction
    const starsWithDistance = allStars.map((star, idx) => {
      const starPos = new THREE.Vector3(...star.position);
      const distance = cameraPos.distanceTo(starPos);
      
      // Calculate angle between camera direction and star direction
      const toStar = starPos.clone().sub(cameraPos).normalize();
      const angle = cameraDir.angleTo(toStar);
      
      // Prioritize stars in front of camera (angle < 90 degrees)
      const inView = angle < Math.PI / 2;
      const priority = inView ? distance : distance * 10; // Stars behind get lower priority
      
      return {
        star,
        index: idx,
        distance,
        angle,
        priority,
        inView
      };
    });
    
    // Sort by priority (distance for stars in view, far away for stars behind)
    starsWithDistance.sort((a, b) => a.priority - b.priority);
    const closestStars = starsWithDistance.slice(0, maxVisibleStars);
    visibleStarsRef.current = closestStars.map(s => s.index);

    // Render only visible stars
    closestStars.forEach((item, i) => {
      const star = item.star;
      
      // Pulsation effect
      const pulsate = 1 + Math.sin(time * star.speed + item.index * 0.1) * 0.15;
      
      // Hover effect
      const hoverScale = item.index === hovered ? 2.0 : 1;
      const finalScale = originalScalesRef.current![item.index] * pulsate * hoverScale;
      
      dummy.position.set(...star.position);
      dummy.scale.setScalar(finalScale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    // Hide remaining slots
    dummy.scale.setScalar(0);
    for (let i = closestStars.length; i < maxVisibleStars; i++) {
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Interaction handlers
  const handleClick = (event: any) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    if (instanceId !== undefined && instanceId < visibleStarsRef.current.length) {
      const actualStarIndex = visibleStarsRef.current[instanceId];
      const star = allStars[actualStarIndex];
      console.log('✨ Clicked star:', star);
      onStarClick?.(star);
    }
  };

  const handlePointerMove = (event: any) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    
    if (instanceId !== undefined && instanceId < visibleStarsRef.current.length) {
      const actualStarIndex = visibleStarsRef.current[instanceId];
      setHovered(actualStarIndex);
      onStarHover?.(allStars[actualStarIndex]);
      document.body.style.cursor = 'pointer';
    } else {
      setHovered(null);
      onStarHover?.(null);
      document.body.style.cursor = 'grab';
    }
  };

  const handlePointerOut = () => {
    setHovered(null);
    onStarHover?.(null);
    document.body.style.cursor = 'grab';
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, maxVisibleStars]}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
    >
      <sphereGeometry args={[2.5, 24, 24]} />
      <meshStandardMaterial 
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={2.5}
        transparent
        toneMapped={false}
        depthWrite={true}
      />
    </instancedMesh>
  );
}
