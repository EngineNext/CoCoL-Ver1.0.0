import React, { useState, useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Loader2, AlertTriangle, Navigation, Globe, ExternalLink } from 'lucide-react';
import {
  getCurrentPosition,
  fetchNearbyClinics,
  OFFICIAL_DIRECTORIES,
  verifyLanguageUrl,
} from './hospitals';

const clinicIcon = L.divIcon({
  html: '<div style="font-size:22px;line-height:1">🏥</div>',
  className: 'clinic-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 22],
});
const userIcon = L.divIcon({
  html: '<div style="font-size:20px;line-height:1">📍</div>',
  className: 'user-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

export default function HospitalMap({ t, lang }) {
  const [radius, setRadius] = useState(2000);
  const [phase, setPhase] = useState('idle'); // idle | locating | searching | done | error
  const [error, setError] = useState('');
  const [clinics, setClinics] = useState([]);
  const [pos, setPos] = useState(null);

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  const locate = async () => {
    setError('');
    setPhase('locating');
    try {
      const p = await getCurrentPosition();
      setPos(p);
      setPhase('searching');
      const list = await fetchNearbyClinics(p.lat, p.lon, radius);
      setClinics(list);
      setPhase('done');
    } catch (err) {
      if (err && err.code === 1) setError(t.mapGeoDenied);
      else setError(t.errorGeneric || 'Error');
      setPhase('error');
    }
  };

  // 地図の初期化とマーカー描画
  useEffect(() => {
    if (!pos || !mapDivRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(mapDivRef.current).setView([pos.lat, pos.lon], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(mapRef.current);
      layerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    const map = mapRef.current;
    const layer = layerRef.current;
    layer.clearLayers();

    L.marker([pos.lat, pos.lon], { icon: userIcon }).addTo(layer);

    const bounds = [[pos.lat, pos.lon]];
    clinics.forEach((c) => {
      const label = lang === 'ja' ? c.nameJa || c.name : c.name;
      L.marker([c.lat, c.lon], { icon: clinicIcon })
        .bindPopup(`<b>${label}</b><br/>${fmtDist(c.distance)}`)
        .addTo(layer);
      bounds.push([c.lat, c.lon]);
    });
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    else map.setView([pos.lat, pos.lon], 15);

    setTimeout(() => map.invalidateSize(), 100);
  }, [pos, clinics, lang]);

  // アンマウント時に地図を破棄
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const busy = phase === 'locating' || phase === 'searching';

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
        <MapPin size={18} className="text-sky-600" />
        {t.mapTitle}
      </h2>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-500">{t.mapRadius}:</label>
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm"
        >
          <option value={1000}>1 km</option>
          <option value={2000}>2 km</option>
          <option value={5000}>5 km</option>
        </select>
        <button
          onClick={locate}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          {phase === 'locating' ? t.mapLocating : phase === 'searching' ? t.mapSearching : t.mapLocate}
        </button>
      </div>

      {error && (
        <p className="mb-3 flex items-start gap-1.5 text-sm text-red-500">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {pos && (
        <div ref={mapDivRef} className="mb-3 h-64 w-full overflow-hidden rounded-xl ring-1 ring-slate-200" />
      )}

      {phase === 'done' && clinics.length === 0 && (
        <p className="text-sm text-slate-500">{t.mapNone}</p>
      )}

      {clinics.length > 0 && (
        <ul className="space-y-2">
          {clinics.slice(0, 12).map((c) => {
            const label = lang === 'ja' ? c.nameJa || c.name : c.name;
            return (
              <li key={c.id} className="rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-900">{label}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {t.mapDistance} {fmtDist(c.distance)}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline"
                  >
                    <Navigation size={12} />
                    {t.mapDirections}
                  </a>
                  <a
                    href={verifyLanguageUrl(c, lang === 'ja' ? '外国語' : 'English')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-slate-500 hover:underline"
                  >
                    <Globe size={12} />
                    {t.mapVerifyLang}
                  </a>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="font-medium text-slate-500 hover:underline">
                      {c.phone}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 対応言語の公式情報 */}
      <div className="mt-4 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100">
        <p className="mb-1.5 text-xs font-semibold text-sky-800">{t.mapOfficialTitle}</p>
        <div className="flex flex-col gap-1.5">
          {OFFICIAL_DIRECTORIES.map((d) => (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"
            >
              {d.name[lang] || d.name.en}
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-sky-700/80">{t.mapLangNote}</p>
      </div>
    </div>
  );
}
