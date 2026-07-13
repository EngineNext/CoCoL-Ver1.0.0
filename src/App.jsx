import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TreeScene from './components/TreeScene.jsx';
import Popup from './components/Popup.jsx';

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-eyebrow">Arbor Vitae ― 生命の樹</p>
        <h1 className="app-title">進化の樹形図</h1>
        <p className="app-subtitle">
          共通祖先から枝分かれした生命の系譜を 3D でたどる博物図鑑
        </p>
      </header>

      <div className="app-hint">
        <span>🖱 ドラッグで回転</span>
        <span>🔍 ホイールで拡大</span>
        <span>✨ 金の輪の動物をクリックで図鑑</span>
      </div>

      <Canvas
        className="app-canvas"
        camera={{ position: [0, 20, 62], fov: 50 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#f6f1e4']} />
        <fog attach="fog" args={['#f6f1e4', 70, 150]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[20, 40, 20]} intensity={1.1} color="#fff6e0" />
        <directionalLight position={[-25, 10, -20]} intensity={0.4} color="#d8c9a3" />

        <TreeScene selected={selected?.id} onSelect={setSelected} />

        <OrbitControls
          enablePan={false}
          minDistance={25}
          maxDistance={110}
          maxPolarAngle={Math.PI / 1.6}
          autoRotate={false}
        />
      </Canvas>

      <footer className="app-footer">
        Naturalist&rsquo;s Atlas · すべての生命は一つの根から
      </footer>

      <Popup node={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
