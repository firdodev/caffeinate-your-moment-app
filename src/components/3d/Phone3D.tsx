
import React, { useRef, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface Phone3DModelProps {
  handleMouseMove: (e: ThreeEvent<PointerEvent>) => void;
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
      {/* Phone Body - Frameless design */}
      <mesh castShadow position={[0, 0, 0]}>
        <roundedBoxGeometry args={[2.8, 5.6, 0.3, 10, 0.15]} />
        <meshStandardMaterial 
          color="#F2FCE2" 
          roughness={0.1} 
          metalness={0.8} 
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Phone Screen */}
      <mesh position={[0, 0, 0.16]} receiveShadow>
        <roundedBoxGeometry args={[2.7, 5.5, 0.05, 10, 0.15]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          roughness={0.1} 
          metalness={0.2}
          map={new THREE.TextureLoader().load('https://images.unsplash.com/photo-1511920170033-f8396924c348?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=1200&q=80')}
        />
      </mesh>
      
      {/* Camera bump */}
      <mesh position={[0.8, 2.2, 0.2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
        <meshStandardMaterial color="#333333" roughness={0.5} />
      </mesh>
      
      {/* Green camera ring */}
      <mesh position={[0.8, 2.2, 0.22]} castShadow>
        <torusGeometry args={[0.15, 0.03, 16, 32]} />
        <meshStandardMaterial color="#4CAF50" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
};

// Custom rounded box geometry
const roundedBoxGeometry = (props: any) => {
  const { args } = props;
  const [width, height, depth, radius, smoothness] = args || [1, 1, 1, 0.05, 4];
  
  // Create rounded box geometry
  const shape = new THREE.Shape();
  const w = width / 2 - radius;
  const h = height / 2 - radius;
  
  // Draw rounded rectangle
  shape.moveTo(-w, -h - radius);
  shape.lineTo(-w, h);
  shape.quadraticCurveTo(-w, h + radius, -w + radius, h + radius);
  shape.lineTo(w - radius, h + radius);
  shape.quadraticCurveTo(w, h + radius, w, h);
  shape.lineTo(w, -h);
  shape.quadraticCurveTo(w, -h - radius, w - radius, -h - radius);
  shape.lineTo(-w + radius, -h - radius);
  shape.quadraticCurveTo(-w, -h - radius, -w, -h);
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius
  });
  
  return <primitive object={geometry} attach="geometry" {...props} />;
};

const Phone3D: React.FC = () => {
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);

  const handleMouseMove = (e: ThreeEvent<PointerEvent>) => {
    // Convert pointer position to rotation angles
    if (e && e.point) {
      const x = (e.point.y / 3) * Math.PI * 0.2;
      const y = (e.point.x / 3) * Math.PI * 0.2;
      setRotation([-x, y, 0]);
    }
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
        
        <group rotation={rotation}>
          <Phone3DModel 
            handleMouseMove={handleMouseMove} 
            handleMouseLeave={handleMouseLeave}
          />
        </group>
      </Canvas>
    </div>
  );
};

export default Phone3D;
