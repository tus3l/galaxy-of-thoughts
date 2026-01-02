'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GalaxyProps, StarData } from '@/types';
import { supabase } from '@/lib/supabase';

export default function Galaxy({ 
  onStarClick, 
  onStarHover, 
  newStarPosition, 
  refreshTrigger,
  targetStarId,
  onReady,
  onStarsLoaded
}: Omit<GalaxyProps, 'starCount' | 'starData'> & { 
  newStarPosition?: [number, number, number];
  refreshTrigger?: number;
  targetStarId?: number | null;
  onReady?: () => void;
  onStarsLoaded?: (stars: any[]) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const originalScalesRef = useRef<Float32Array>();
  const visibleStarsRef = useRef<number[]>([]);
  const { camera, gl, raycaster, pointer, size, scene } = useThree();
  const [realStars, setRealStars] = useState<StarData[]>([]);
  const newStarAnimationRef = useRef<{ index: number; startTime: number } | null>(null);
  const instanceColorsRef = useRef<Float32Array>();
  const particlesRef = useRef<THREE.Points | null>(null);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  
  // Fetch real stars from Supabase only
  useEffect(() => {
    const fetchStars = async () => {
      const { data, error } = await supabase
        .from('stars')
        .select('*')
        .order('id', { ascending: true }); // Order by ID so Star #0 is first
      
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
        onReady?.(); // إشعار Scene أن المجرة جاهزة
      } else if (error) {
        console.error('Error fetching stars:', error);
      }
    };
    
    fetchStars();
  }, [refreshTrigger, onReady]); // Re-fetch when refreshTrigger changes
  
  // Use real stars only
  const allStars = realStars;
  
  // Pass stars to parent
  useEffect(() => {
    if (allStars.length > 0 && onStarsLoaded) {
      onStarsLoaded(allStars);
    }
  }, [allStars, onStarsLoaded]);
  
  // Manual click detection with DOM events
  useEffect(() => {
    const canvas = gl.domElement;
    
    const handleCanvasClick = (event: MouseEvent | TouchEvent) => {
      if (!meshRef.current || allStars.length === 0) {
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
      
      // Make sure instanceMatrix is updated
      if (meshRef.current.instanceMatrix.needsUpdate === false) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
      
      // Update bounding sphere for raycasting
      if (meshRef.current.geometry.boundingSphere === null) {
        meshRef.current.geometry.computeBoundingSphere();
      }
      
      // Setup raycaster
      const mouseRaycaster = new THREE.Raycaster();
      mouseRaycaster.params.Points = { threshold: 5 };
      mouseRaycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      
      // Check intersection with instancedMesh
      const intersects = mouseRaycaster.intersectObject(meshRef.current, false);
      
      if (intersects.length === 0) {
        // Try to check all stars manually
        let closestDistance = Infinity;
        let closestIndex = -1;
        
        allStars.forEach((star, index) => {
          const starPos = new THREE.Vector3(...star.position);
          const distance = mouseRaycaster.ray.distanceToPoint(starPos);
          if (distance < closestDistance && distance < 10) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        
        if (closestIndex >= 0) {
          onStarClick?.(allStars[closestIndex]);
          return;
        }
      }
      
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const instanceId = intersection.instanceId;
        
        if (instanceId !== undefined && instanceId < allStars.length) {
          const star = allStars[instanceId];
          onStarClick?.(star);
        }
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
    if (newStarPosition) {
      // Start animation immediately when position is set
      newStarAnimationRef.current = {
        index: -1, // Will be updated when star is loaded
        startTime: Date.now()
      };
      
      // Create cosmic dust particles
      if (particlesRef.current) {
        scene.remove(particlesRef.current);
      }
      
      const particleCount = 600; // Massive dust cloud
      const particleGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleVelocities: THREE.Vector3[] = [];
      
      const [targetX, targetY, targetZ] = newStarPosition;
      
      // Spawn particles in sphere around target
      for (let i = 0; i < particleCount; i++) {
        const radius = 50 + Math.random() * 40; // 50-90 units away - very spread out
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        particlePositions[i * 3] = targetX + radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = targetY + radius * Math.sin(phi) * Math.sin(theta);
        particlePositions[i * 3 + 2] = targetZ + radius * Math.cos(phi);
        
        particleVelocities.push(new THREE.Vector3());
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      
      const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff, // Pure white dust
        size: 0.4, // Tiny dust particles
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true // Size based on distance
      });
      
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);
      particlesRef.current = particles;
      
      // Animate particles converging
      const particleStartTime = Date.now();
      const particleAnimation = () => {
        if (!particlesRef.current) return;
        
        const elapsed = Date.now() - particleStartTime;
        if (elapsed > 3500) {
          // Remove particles after gathering (3.5 seconds)
          scene.remove(particlesRef.current);
          particlesRef.current = null;
          return;
        }
        
        const progress = elapsed / 3500;
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const currentX = positions[idx];
          const currentY = positions[idx + 1];
          const currentZ = positions[idx + 2];
          
          // Accelerate toward target (slower for 3.5 seconds)
          const dx = targetX - currentX;
          const dy = targetY - currentY;
          const dz = targetZ - currentZ;
          
          const acceleration = Math.pow(progress, 2) * 0.3; // Slower convergence over 3.5 seconds
          
          positions[idx] += dx * acceleration;
          positions[idx + 1] += dy * acceleration;
          positions[idx + 2] += dz * acceleration;
        }
        
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        
        // Fade out particles gradually
        const material = particlesRef.current.material as THREE.PointsMaterial;
        material.opacity = 1.0 * (1 - Math.pow(progress, 2)); // Slower fade
        
        requestAnimationFrame(particleAnimation);
      };
      
      particleAnimation();
      
      // Create shockwave at ignition time (2.2s)
      setTimeout(() => {
        const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.5, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.set(targetX, targetY, targetZ);
        
        // Orient toward camera
        shockwave.lookAt(camera.position);
        
        scene.add(shockwave);
        shockwaveRef.current = shockwave;
        
        // Animate shockwave expanding
        const shockwaveStartTime = Date.now();
        const shockwaveDuration = 1000; // 1 second
        
        const shockwaveAnimation = () => {
          if (!shockwaveRef.current) return;
          
          const elapsed = Date.now() - shockwaveStartTime;
          if (elapsed > shockwaveDuration) {
            scene.remove(shockwaveRef.current);
            shockwaveRef.current = null;
            return;
          }
          
          const progress = elapsed / shockwaveDuration;
          const scale = 1 + progress * 50; // Expand to 50 units
          shockwaveRef.current.scale.set(scale, scale, 1);
          
          // Fade out
          const material = shockwaveRef.current.material as THREE.MeshBasicMaterial;
          material.opacity = 0.6 * (1 - progress);
          
          // Push nearby stars
          if (meshRef.current) {
            const shockwaveRadius = scale * 0.5;
            const dummy = new THREE.Object3D();
            
            allStars.forEach((star, i) => {
              const [sx, sy, sz] = star.position;
              const dx = sx - targetX;
              const dy = sy - targetY;
              const dz = sz - targetZ;
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
              
              if (distance < shockwaveRadius && distance > 0.1) {
                // Push force inversely proportional to distance
                const force = (1 - (distance / shockwaveRadius)) * 0.5 * (1 - progress);
                
                const pushX = (dx / distance) * force;
                const pushY = (dy / distance) * force;
                const pushZ = (dz / distance) * force;
                
                dummy.position.set(sx + pushX, sy + pushY, sz + pushZ);
                dummy.scale.setScalar(1);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
              }
            });
            
            meshRef.current.instanceMatrix.needsUpdate = true;
          }
          
          requestAnimationFrame(shockwaveAnimation);
        };
        
        shockwaveAnimation();
      }, 4300); // Start at ignition moment (after 3.5s dust gathering)
      
      // After a short delay, find the actual star index
      setTimeout(() => {
        if (allStars.length > 0) {
          const newStarIndex = allStars.length - 1;
          if (newStarAnimationRef.current) {
            newStarAnimationRef.current.index = newStarIndex;
          }
        }
      }, 100);
      
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
  
  // تمييز النجمة المستهدفة عند البحث (بدون أنميشن الانفجار)
  useEffect(() => {
    if (targetStarId !== null && targetStarId !== undefined) {
      const starIndex = allStars.findIndex(s => s.id === targetStarId);
      
      if (starIndex !== -1) {
        // افتح النجمة مباشرة بعد تحريك الكاميرا
        const openTimer = setTimeout(() => {
          const star = allStars[starIndex];
          onStarClick?.(star);
        }, 2200); // 2.2 ثانية للكاميرا
        
        return () => {
          clearTimeout(openTimer);
        };
      }
    }
  }, [targetStarId, allStars, onStarClick]);
  
  // Show all stars (no limit for now since we only show real ones)
  const maxVisibleStars = Math.max(allStars.length, 10); // At least 10 instances
  
  // Store original scales and colors
  useEffect(() => {
    if (allStars.length > 0 && meshRef.current) {
      originalScalesRef.current = new Float32Array(allStars.map(s => s.scale));
      
      // Create color array for instances (RGB for each star)
      const colors = new Float32Array(maxVisibleStars * 3);
      allStars.forEach((star, i) => {
        const color = star.color || new THREE.Color('#ffffff');
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      });
      
      // Fill remaining slots with white
      for (let i = allStars.length; i < maxVisibleStars; i++) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      }
      
      instanceColorsRef.current = colors;
      
      // Apply colors to geometry
      const geometry = meshRef.current.geometry;
      if (geometry) {
        geometry.setAttribute(
          'color',
          new THREE.InstancedBufferAttribute(colors, 3)
        );
        geometry.attributes.color.needsUpdate = true;
      }
    }
  }, [allStars, maxVisibleStars]);
  
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
        const totalDuration = 6000; // 6 seconds total
        
        // Phase 1: Dust gathering (0-3.5s)
        // Phase 2: Compression (3.5-4.3s)
        // Phase 3: Ignition + Shockwave (4.3-4.6s)
        // Phase 4: Settle (4.6-6s)
        
        if (elapsed < 3500) {
          // Dust gathering - particles converge (handled by particle system)
          explosionScale = 0.1; // Star is tiny while dust gathers
          glowIntensity = 0.1;
        } else if (elapsed < 4300) {
          // Compression phase
          const compressProgress = (elapsed - 3500) / 800;
          explosionScale = 0.1 - (compressProgress * 0.05); // Compress smaller
          glowIntensity = 0.5 + (compressProgress * 1.5); // Brightness increases
        } else if (elapsed < 4600) {
          // Ignition burst!
          const burstProgress = (elapsed - 4300) / 300;
          const burst = Math.pow(1 - burstProgress, 2); // Exponential decay
          explosionScale = 0.05 + (burst * 4); // Massive burst to 4x
          glowIntensity = 3 + (burst * 5); // Intense flash
        } else if (elapsed < totalDuration) {
          // Settle to normal
          const settleProgress = (elapsed - 4600) / 1400;
          const easeOut = 1 - Math.pow(1 - settleProgress, 3);
          explosionScale = 1 + ((4 - 1) * (1 - easeOut));
          glowIntensity = 1 + ((8 - 1) * (1 - easeOut));
        } else {
          // Animation complete
          explosionScale = 1;
          glowIntensity = 1;
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
        e.stopPropagation();
      }}
      onPointerUp={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
    >
      <sphereGeometry args={[4, 16, 16]} />
      <meshStandardMaterial 
        vertexColors
        emissiveIntensity={1.5}
        toneMapped={false}
        transparent
        depthWrite={true}
        onBeforeCompile={(shader) => {
          // تعديل الـ shader ليستخدم vertex colors كـ emissive أيضاً
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
            #include <color_fragment>
            // استخدام vertex color كـ emissive
            vec3 emissiveColor = vColor * 1.5;
            totalEmissiveRadiance = emissiveColor;
            `
          );
        }}
      />
    </instancedMesh>
  );
}
