'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GalaxyProps, StarData } from '@/types';
import { supabase } from '@/lib/supabase';

export default function Galaxy({ onStarClick, onStarHover, newStarPosition, refreshTrigger }: Omit<GalaxyProps, 'starCount' | 'starData'> & { newStarPosition?: [number, number, number], refreshTrigger?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const originalScalesRef = useRef<Float32Array>();
  const visibleStarsRef = useRef<number[]>([]);
  const { camera, gl, raycaster, pointer, size } = useThree();
  const [realStars, setRealStars] = useState<StarData[]>([]);
  const newStarAnimationRef = useRef<{ index: number; startTime: number } | null>(null);
  
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
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes
  
  // Use real stars only
  const allStars = realStars;
  
  // Manual click detection with DOM events
  useEffect(() => {
    const canvas = gl.domElement;
    
    const handleCanvasClick = (event: MouseEvent | TouchEvent) => {
      console.log('🖱️ Canvas clicked!', event.type);
      
      if (!meshRef.current || allStars.length === 0) {
        console.log('❌ No mesh or stars');
        return;
      }
      
      // Get click coordinates
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      
      if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else {
        clientX = event.touches[0]?.clientX || event.changedTouches[0]?.clientX;
        clientY = event.touches[0]?.clientY || event.changedTouches[0]?.clientY;
      }
      
      // Calculate normalized device coordinates
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      
      console.log('📍 Click coords:', { x, y, clientX, clientY });
      
      // Make sure instanceMatrix is updated
      if (meshRef.current.instanceMatrix.needsUpdate === false) {
        console.log('⚠️ instanceMatrix needs update!');
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
      
      // Update bounding sphere for raycasting
      if (meshRef.current.geometry.boundingSphere === null) {
        meshRef.current.geometry.computeBoundingSphere();
        console.log('🔵 Computing bounding sphere');
      }
      
      console.log('📏 Mesh info:', {
        position: meshRef.current.position,
        visible: meshRef.current.visible,
        instanceCount: allStars.length,
        boundingSphere: meshRef.current.geometry.boundingSphere
      });
      
      // Setup raycaster
      const mouseRaycaster = new THREE.Raycaster();
      // Increase raycaster threshold for easier clicking
      mouseRaycaster.params.Points = { threshold: 5 };
      mouseRaycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      
      // Check intersection with instancedMesh
      const intersects = mouseRaycaster.intersectObject(meshRef.current, false);
      console.log('🎯 Intersections:', intersects.length);
      
      if (intersects.length === 0) {
        console.log('🔍 Debugging: Testing ray direction and camera');
        console.log('Camera position:', camera.position);
        console.log('Ray origin:', mouseRaycaster.ray.origin);
        console.log('Ray direction:', mouseRaycaster.ray.direction);
        
        // Try to check all stars manually
        const sphereGeometry = new THREE.SphereGeometry(4, 16, 16);
        let closestDistance = Infinity;
        let closestIndex = -1;
        
        allStars.forEach((star, index) => {
          const starPos = new THREE.Vector3(...star.position);
          const distance = mouseRaycaster.ray.distanceToPoint(starPos);
          console.log(`Star ${index} at`, star.position, 'distance to ray:', distance);
          if (distance < closestDistance && distance < 10) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        
        if (closestIndex >= 0) {
          console.log('🎯 Found closest star manually!', closestIndex);
          onStarClick?.(allStars[closestIndex]);
          return;
        }
      }
      
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const instanceId = intersection.instanceId;
        console.log('✨ Hit star instance:', instanceId);
        
        if (instanceId !== undefined && instanceId < allStars.length) {
          const star = allStars[instanceId];
          console.log('🌟 Opening star:', star);
          onStarClick?.(star);
        }
      } else {
        console.log('❌ No intersection');
      }
    };
    
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchend', handleCanvasClick);
    
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('touchend', handleCanvasClick);
    };
  }, [gl, camera, allStars, onStarClick]);
  
  // Move camera to new star when created
  useEffect(() => {
    if (newStarPosition && allStars.length > 0) {
      // Find the newly created star (last one in the array)
      const newStarIndex = allStars.length - 1;
      newStarAnimationRef.current = {
        index: newStarIndex,
        startTime: Date.now()
      };
      
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
  }, [newStarPosition, camera, allStars]);
  
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
      // Explosion/flash animation for new star
      let explosionScale = 1;
      let glowIntensity = 1;
      
      if (newStarAnimationRef.current && newStarAnimationRef.current.index === i) {
        const elapsed = Date.now() - newStarAnimationRef.current.startTime;
        const animDuration = 1500; // 1.5 seconds explosion animation
        
        if (elapsed < animDuration) {
          const progress = elapsed / animDuration;
          
          // Phase 1: Explosion (0 - 0.3) - rapid expansion with bright flash
          if (progress < 0.3) {
            const phase1 = progress / 0.3;
            explosionScale = 0.1 + (phase1 * 8); // Scale from 0.1 to 8
            glowIntensity = 10 - (phase1 * 7); // Intense glow 10 -> 3
          }
          // Phase 2: Contraction (0.3 - 0.6) - pull back
          else if (progress < 0.6) {
            const phase2 = (progress - 0.3) / 0.3;
            explosionScale = 8 - (phase2 * 6.5); // Scale from 8 to 1.5
            glowIntensity = 3 - (phase2 * 1); // Glow 3 -> 2
          }
          // Phase 3: Settle (0.6 - 1.0) - smooth to normal
          else {
            const phase3 = (progress - 0.6) / 0.4;
            const easeOut = 1 - Math.pow(1 - phase3, 3);
            explosionScale = 1.5 - (easeOut * 0); // Stay at 1.5
            glowIntensity = 2 - (easeOut * 1); // Glow 2 -> 1
          }
        } else {
          // Animation complete
          newStarAnimationRef.current = null;
        }
      }
      
      // Pulsation effect
      const pulsate = 1 + Math.sin(time * star.speed + i * 0.1) * 0.15;
      
      // Hover effect
      const hoverScale = i === hovered ? 2.0 : 1;
      const finalScale = (originalScalesRef.current?.[i] || 1.5) * pulsate * hoverScale * explosionScale;
      
      dummy.position.set(...star.position);
      dummy.scale.setScalar(finalScale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Update material emissive intensity for glow effect (if possible via instance)
      // Note: We can't change per-instance material properties with InstancedMesh
      // The glow will be implicit from the scale increase
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
    console.log('👆 Click event received:', event);
    event.stopPropagation();
    const instanceId = event.instanceId;
    console.log('🖱️ Clicked instance:', instanceId, 'Total stars:', allStars.length);
    console.log('📍 Event details:', {
      instanceId,
      point: event.point,
      distance: event.distance,
      object: event.object?.type
    });
    
    if (instanceId !== undefined && instanceId < allStars.length) {
      const star = allStars[instanceId];
      console.log('✨ Clicked star:', star);
      console.log('📞 Calling onStarClick with star data');
      onStarClick?.(star);
    } else {
      console.log('❌ Invalid instanceId or out of range');
    }
  };

  const handlePointerMove = (event: any) => {
    event.stopPropagation();
    const instanceId = event.instanceId;
    
    if (instanceId !== undefined && instanceId < allStars.length) {
      setHovered(instanceId);
      onStarHover?.(allStars[instanceId]);
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
      onPointerDown={(e) => {
        console.log('👇 Pointer down on star');
        e.stopPropagation();
      }}
      onPointerUp={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
    >
      <sphereGeometry args={[4, 16, 16]} />
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
