
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

interface BeanProps {
  position: [number, number, number];
  scale?: number;
  rotation?: number;
}

const Bean: React.FC<BeanProps> = ({ position, scale = 1, rotation = 0 }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  // Create a closure for this bean's animation cycle
  const offset = Math.random() * Math.PI * 2;
  const speed = 0.5 + Math.random() * 0.5;
  
  useFrame((state) => {
    if (!ref.current) return;
    
    // Gentle floating animation
    ref.current.position.y = position[1] + Math.sin(offset + state.clock.elapsedTime * speed) * 0.3;
    ref.current.rotation.x = rotation + state.clock.elapsedTime * 0.2;
    ref.current.rotation.z = rotation + state.clock.elapsedTime * 0.3;
  });

  return (
    <mesh ref={ref} position={new THREE.Vector3(position[0], position[1], position[2])} scale={scale} castShadow>
      <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
      <meshStandardMaterial color="#5E4B3E" roughness={0.8} />
    </mesh>
  );
};

const FloatingBeans = () => {
  // Create several coffee beans with different positions
  const beanPositions: [number, number, number][] = [
    [-2, 0, -1],
    [2, 0.5, 1],
    [-1, 1, 2],
    [0.5, -0.5, -2],
    [1.5, 0.8, -0.5],
    [-1.8, -0.2, 0.5],
  ];

  return (
    <div className="absolute inset-0 z-0 opacity-70">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        {beanPositions.map((position, index) => (
          <Bean 
            key={index} 
            position={position} 
            scale={0.5 + Math.random() * 0.5} 
            rotation={Math.random() * Math.PI} 
          />
        ))}
        
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
};

export default FloatingBeans;
