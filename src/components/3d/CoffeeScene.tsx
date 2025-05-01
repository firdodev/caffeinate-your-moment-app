
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

const CoffeeCup = () => {
  const cupRef = useRef<THREE.Mesh>(null);
  
  // Simple animation for the coffee cup
  useFrame((state) => {
    if (cupRef.current) {
      cupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group>
      {/* Simple 3D coffee cup representation */}
      <mesh ref={cupRef} position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[1, 0.8, 2, 32]} />
        <meshStandardMaterial color="#D4A76A" roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* Cup handle */}
      <mesh position={[1.2, 0, 0]} castShadow>
        <torusGeometry args={[0.3, 0.1, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#D4A76A" roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* Coffee inside the cup */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.1, 32]} />
        <meshStandardMaterial color="#5E4B3E" roughness={0.3} />
      </mesh>
      
      {/* Steam particles */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[Math.sin(i) * 0.2, 1 + i * 0.2, Math.cos(i) * 0.2]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="white" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
};

const CoffeeScene = () => {
  return (
    <div className="h-[300px] md:h-[400px] lg:h-[500px] w-full">
      <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 2, 5], fov: 50 }}>
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <PresentationControls
          global
          zoom={0.8}
          rotation={[0, -Math.PI / 4, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}>
          <CoffeeCup />
        </PresentationControls>
        <Environment preset="city" />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
};

export default CoffeeScene;
