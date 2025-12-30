import * as THREE from 'three';

// Vertex Shader - Handles position and pulsation
export const vertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  
  attribute float aScale;
  attribute float aSpeed;
  attribute vec3 aColor;
  
  varying vec3 vColor;
  varying float vPulsate;
  
  void main() {
    // Pass color to fragment shader
    vColor = aColor;
    
    // Calculate pulsation
    float pulsate = 1.0 + sin(uTime * aSpeed + position.x * 0.1) * 0.15;
    vPulsate = pulsate;
    
    // Position calculation
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
    
    // Point size with pulsation
    gl_PointSize = aScale * pulsate * uPixelRatio;
    gl_PointSize *= (1.0 / - viewPosition.z); // Size attenuation
  }
`;

// Fragment Shader - Handles color and glow
export const fragmentShader = `
  varying vec3 vColor;
  varying float vPulsate;
  
  void main() {
    // Create circular point
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    
    // Soft circle with glow
    float alpha = smoothstep(0.5, 0.0, dist);
    
    // Inner bright core
    float core = smoothstep(0.3, 0.0, dist);
    
    // Combine color with glow
    vec3 finalColor = vColor * (1.0 + core * 2.0);
    finalColor *= vPulsate; // Apply pulsation to brightness
    
    // Output with alpha
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Shader Material Factory
export function createStarShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}
