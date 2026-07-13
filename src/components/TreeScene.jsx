import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { buildLayout } from '../data/tree.js';

const COLORS = {
  root: '#7c5c34',
  clade: '#a98b5d',
  animal: '#8a6d3b',
  branch: '#b9a77f',
  animalNode: '#c9a24b',
};

// 枝：親から子へ、少し弧を描くチューブで結ぶ
function Branch({ from, to }) {
  const points = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = start.clone().lerp(end, 0.5);
    mid.y -= 1.2; // わずかに垂れ下がらせて樹木らしく
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(20);
  }, [from, to]);

  return (
    <Line points={points} color={COLORS.branch} lineWidth={1.6} transparent opacity={0.75} />
  );
}

function Node({ node, selected, onSelect }) {
  const meshRef = useRef();
  const isAnimal = node.kind === 'animal';
  const isRoot = node.kind === 'root';
  const isSelected = selected === node.id;
  const baseSize = isRoot ? 1.5 : isAnimal ? 1.1 : 0.8;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const pulse = isAnimal ? 1 + Math.sin(t * 2 + node.position[0]) * 0.06 : 1;
    const target = (isSelected ? 1.5 : 1) * pulse;
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, target, 0.15)
    );
  });

  const color = isAnimal ? COLORS.animalNode : isRoot ? COLORS.root : COLORS.clade;

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[baseSize, 24, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          metalness={0.35}
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : isAnimal ? 0.2 : 0.08}
        />
      </mesh>

      {/* 動物ノードには金色の輪をあしらう */}
      {isAnimal && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[baseSize + 0.5, 0.08, 12, 40]} />
          <meshStandardMaterial color="#b8860b" roughness={0.4} metalness={0.6} />
        </mesh>
      )}

      <Html center distanceFactor={26} position={[0, baseSize + 1.6, 0]} zIndexRange={[10, 0]}>
        <button
          className={`node-label ${isAnimal ? 'is-animal' : ''} ${isSelected ? 'is-selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
        >
          {node.name}
          {isAnimal && <span className="node-label-hint">クリックで図鑑</span>}
        </button>
      </Html>
    </group>
  );
}

export default function TreeScene({ selected, onSelect }) {
  const { nodes, links } = useMemo(() => buildLayout(), []);
  const groupRef = useRef();

  // ゆっくり自動回転
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, -18, 0]}>
      {links.map((l) => (
        <Branch key={l.id} from={l.from} to={l.to} />
      ))}
      {nodes.map((n) => (
        <Node key={n.id} node={n} selected={selected} onSelect={onSelect} />
      ))}
    </group>
  );
}
