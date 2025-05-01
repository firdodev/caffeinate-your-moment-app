
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

const Bean = () => {
  const beanRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (beanRef.current) {
      beanRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      beanRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <mesh ref={beanRef} castShadow>
      <capsuleGeometry args={[0.6, 1.2, 16, 32]} />
      <meshStandardMaterial 
        color="#5E4B3E"
        roughness={0.7}
        metalness={0.2}
      />
    </mesh>
  );
};

const RotatingCoffeeBean = () => {
  return (
    <div className="h-24 w-24">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Bean />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
};

export default RotatingCoffeeBean;
