
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Text, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

// Cup component that the player controls
const Cup = ({ position, onMoveCup }: { position: number, onMoveCup: (x: number) => void }) => {
  const cupRef = useRef<THREE.Group>(null);

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (e && e.point && cupRef.current) {
      // Constrain x position within bounds (-2.5 to 2.5)
      const x = Math.max(-2.5, Math.min(2.5, e.point.x));
      onMoveCup(x);
    }
  };

  return (
    <group 
      ref={cupRef} 
      position={[position, -2, 0]} 
      onPointerMove={handlePointerMove}
      scale={[0.7, 0.7, 0.7]}
    >
      {/* Cup body */}
      <mesh castShadow>
        <cylinderGeometry args={[1, 0.8, 2, 32]} />
        <meshStandardMaterial color="#F2FCE2" roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* Cup handle */}
      <mesh position={[1.2, 0, 0]} castShadow>
        <torusGeometry args={[0.3, 0.1, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#F2FCE2" roughness={0.5} metalness={0.2} />
      </mesh>
      
      {/* Coffee inside cup */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.1, 32]} />
        <meshStandardMaterial color="#5E4B3E" roughness={0.3} />
      </mesh>
    </group>
  );
};

// Coffee bean that falls from the top
const Bean = ({ position, onCollect }: { position: [number, number, number], onCollect: () => void }) => {
  const beanRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (beanRef.current) {
      // Move bean downward
      beanRef.current.position.y -= 0.05;
      beanRef.current.rotation.x += 0.02;
      beanRef.current.rotation.y += 0.01;
      
      // Check if bean is out of bounds
      if (beanRef.current.position.y < -3) {
        onCollect();
      }
    }
  });

  return (
    <mesh ref={beanRef} position={position} castShadow>
      <capsuleGeometry args={[0.3, 0.5, 8, 8]} />
      <meshStandardMaterial color="#5E4B3E" roughness={0.8} />
    </mesh>
  );
};

// Score display
const ScoreDisplay = ({ score }: { score: number }) => {
  return (
    <Text
      position={[0, 3, 0]}
      fontSize={0.5}
      color="#4CAF50"
      anchorX="center"
      anchorY="middle"
    >
      Score: {score}
    </Text>
  );
};

const GameScene = () => {
  const [cupPosition, setCupPosition] = useState(0);
  const [beans, setBeans] = useState<Array<{ id: number, position: [number, number, number] }>>([]);
  const [score, setScore] = useState(0);
  const [nextBeanId, setNextBeanId] = useState(1);
  
  // Spawn new beans at random intervals
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const x = (Math.random() - 0.5) * 5;
      setBeans(prev => [...prev, { 
        id: nextBeanId, 
        position: [x, 3, 0] 
      }]);
      setNextBeanId(prev => prev + 1);
    }, 2000);
    
    return () => clearInterval(spawnInterval);
  }, [nextBeanId]);
  
  // Check for collisions between beans and cup
  useFrame(() => {
    const cupBounds = {
      minX: cupPosition - 0.7,
      maxX: cupPosition + 0.7,
      y: -2
    };
    
    setBeans(prevBeans => {
      let scoreIncrease = 0;
      
      const remainingBeans = prevBeans.filter(bean => {
        // Check if bean is in cup's catch area
        if (bean.position[1] < -1.5 && 
            bean.position[1] > -2.5 && 
            bean.position[0] > cupBounds.minX && 
            bean.position[0] < cupBounds.maxX) {
          // Caught a bean!
          scoreIncrease += 1;
          return false;
        }
        
        // Remove beans that fall off screen
        if (bean.position[1] < -3) {
          return false;
        }
        
        return true;
      });
      
      if (scoreIncrease > 0) {
        setScore(prev => prev + scoreIncrease);
      }
      
      return remainingBeans;
    });
  });

  const handleMoveCup = (x: number) => {
    setCupPosition(x);
  };
  
  const handleCollect = (id: number) => {
    setBeans(prev => prev.filter(bean => bean.id !== id));
  };

  return (
    <>
      <PresentationControls
        global
        enabled={false}
        zoom={0.8}
        rotation={[0, 0, 0]}
        polar={[0, 0]}
        azimuth={[0, 0]}>
        <Cup position={cupPosition} onMoveCup={handleMoveCup} />
        {beans.map(bean => (
          <Bean 
            key={bean.id} 
            position={bean.position} 
            onCollect={() => handleCollect(bean.id)} 
          />
        ))}
        <ScoreDisplay score={score} />
      </PresentationControls>
    </>
  );
};

const CoffeeCatchGame = () => {
  return (
    <div className="h-[400px] w-full relative rounded-lg overflow-hidden">
      <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <GameScene />
      </Canvas>
    </div>
  );
};

export default CoffeeCatchGame;
