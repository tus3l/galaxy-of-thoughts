'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GalaxyProps, StarData } from '@/types';
import { supabase } from '@/lib/supabase';

export default function Galaxy({ onStarClick, onStarHover, newStarPosition }: Omit<GalaxyProps, 'starCount' | 'starData'> & { newStarPosition?: [number, number, number] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const originalScalesRef = useRef<Float32Array>();
  const visibleStarsRef = useRef<number[]>([]);
  const { camera } = useThree();
  const [realStars, setRealStars] = useState<StarData[]>([]);
  
  // Fetch real stars from Supabase only
  useEffect(() => {
    const fetchStars = async () => {
      const { data, error } = await supabase
        .from('stars')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        const formattedStars: StarData[] = data
          .filter(star => star.position_x !== null && star.position_y !== null && star.position_z !== null)
          .map((star) => {
            // Build position from separate x, y, z fields
            const position: [number, number, number] = [
              star.position_x,
              star.position_y,
              star.position_z
            ];
            
            return {
              id: star.id,
              position,
              color: new THREE.Color(star.color || '#ffffff'),
              scale: 1.5,
              speed: 0.5,
              message: star.message,
              author: star.author || 'Anonymous',
              createdAt: new Date(star.created_at),
            };
          });
        setRealStars(formattedStars);
        console.log('✨ Loaded stars:', formattedStars.length);
      } else if (error) {
        console.error('Error fetching stars:', error);
      }
    };
    
    fetchStars();
  }, []);
  
  // Move camera to new star when created
  useEffect(() => {
    if (newStarPosition) {
      const [x, y, z] = newStarPosition;
      // Animate camera to new star position (with offset)
      const targetPos = new THREE.Vector3(x + 30, y + 30, z + 50);
      const startPos = camera.position.clone();
      const duration = 2000; // 2 seconds
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // ease out cubic
        
        camera.position.lerpVectors(startPos, targetPos, easeProgress);
        camera.lookAt(x, y, z);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
  }, [newStarPosition, camera]);
  
  // Use real stars only
  const allStars = realStars;
  
  // Show all stars (no limit for now since we only show real ones)
  const maxVisibleStars = Math.max(allStars.length, 10); // At least 10 instances
  
  // Store original scales
  useEffect(() => {
    if (allStars.length > 0) {
      originalScalesRef.current = new Float32Array(allStars.map(s => s.scale));
    }
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
  }, [maxVisibleStars]);

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
    // Render all real stars directly
    allStars.forEach((star, i) => {
      // Pulsation effect
      const pulsate = 1 + Math.sin(time * star.speed + i * 0.1) * 0.15;
      
      // Hover effect
      const hoverScale = i === hovered ? 2.0 : 1;
      const finalScale = (originalScalesRef.current?.[i] || 1.5) * pulsate * hoverScale;
      
      dummy.position.set(...star.position);
      dummy.scale.setScalar(finalScale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    // Update visible stars ref (all stars are visible)
    visibleStarsRef.current = allStars.map((_, i) => i);
    
    // Hide remaining slots
    dummy.scale.setScalar(0);
    for (let i = allStars.length; i < maxVisibleStars; i++) {
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
