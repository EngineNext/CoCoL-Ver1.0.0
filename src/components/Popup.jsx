import React from 'react';

export default function Popup({ node, onClose }) {
  if (!node) return null;
  const info = node.info || {};
  const isAnimal = node.kind === 'animal';

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-corner tl" />
        <div className="popup-corner tr" />
        <div className="popup-corner bl" />
        <div className="popup-corner br" />

        <button className="popup-close" onClick={onClose} aria-label="閉じる">
          ✕
        </button>

        <p className="popup-kind">{isAnimal ? '― 図鑑 ―' : '― 分類群 ―'}</p>
        <h2 className="popup-title">{node.name}</h2>
        <p className="popup-latin">{node.latin}</p>

        <div className="popup-divider">❦</div>

        {info.era && (
          <p className="popup-era">
            <span className="popup-era-label">出現</span> {info.era}
          </p>
        )}

        <p className="popup-summary">{info.summary}</p>

        {info.facts && info.facts.length > 0 && (
          <ul className="popup-facts">
            {info.facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
