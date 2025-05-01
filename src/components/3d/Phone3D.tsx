
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-three/drei';
import * as THREE from 'three';

interface Phone3DModelProps {
  handleMouseMove: (e: THREE.Event) => void;
  handleMouseLeave: () => void;
}

const Phone3DModel: React.FC<Phone3DModelProps> = ({ handleMouseMove, handleMouseLeave }) => {
  const phoneRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (phoneRef.current) {
      // Subtle ambient animation
      phoneRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
    }
  });
  
  return (
    <group 
      ref={phoneRef} 
      onPointerMove={handleMouseMove}
      onPointerLeave={handleMouseLeave}
    >
      {/* Phone Body */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.8, 5.6, 0.4]} />
        <meshStandardMaterial color="#5E4B3E" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Phone Screen */}
      <mesh position={[0, 0, 0.22]} receiveShadow>
        <boxGeometry args={[2.6, 5.4, 0.05]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          roughness={0.1} 
          metalness={0.2}
          map={new THREE.TextureLoader().load('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=1200&q=80')}
        />
      </mesh>
      
      {/* Home Button */}
      <mesh position={[0, -2.4, 0.25]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial color="#333333" roughness={0.5} />
      </mesh>
    </group>
  );
};

const Phone3D: React.FC = () => {
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);

  const handleMouseMove = (e: THREE.Event) => {
    // Convert pointer position to rotation angles
    const x = (e.point.y / 3) * Math.PI * 0.2;
    const y = (e.point.x / 3) * Math.PI * 0.2;
    setRotation([-x, y, 0]);
  };

  const handleMouseLeave = () => {
    setRotation([0, 0, 0]);
  };

  return (
    <div className="h-[400px] sm:h-[500px] md:h-[550px] w-full relative">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 25 }}>
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={1.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={1} castShadow />
        
        <animated.group rotation={rotation}>
          <Phone3DModel 
            handleMouseMove={handleMouseMove} 
            handleMouseLeave={handleMouseLeave}
          />
        </animated.group>
      </Canvas>
    </div>
  );
};

export default Phone3D;
