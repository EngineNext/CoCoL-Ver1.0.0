// --- 近隣の医療機関検索（OpenStreetMap / Overpass API・無料・キー不要） ---
//
// 注意: OSM には「対応言語」情報がほとんど含まれません。言語対応は必ず
// 公的な外国語対応医療機関リスト（JNTO・AMDA 等）で確認する前提とし、
// 本アプリはあくまで「近くの医療機関の位置」を地図表示する用途です。

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('NO_GEO'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * 現在地周辺の病院・クリニックを取得（距離順）。
 * @param {number} lat @param {number} lon @param {number} radius メートル
 */
export async function fetchNearbyClinics(lat, lon, radius = 2000) {
  const query = `[out:json][timeout:25];(
    node["amenity"~"^(hospital|clinic|doctors)$"](around:${radius},${lat},${lon});
    way["amenity"~"^(hospital|clinic|doctors)$"](around:${radius},${lat},${lon});
  );out center 60;`;

  const res = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error('OVERPASS_' + res.status);
  const data = await res.json();

  const items = (data.elements || [])
    .map((el) => {
      const p = el.type === 'node' ? { lat: el.lat, lon: el.lon } : el.center || {};
      const t = el.tags || {};
      const langs = [];
      if (t['language:en'] === 'yes' || t['language:en'] === 'main') langs.push('en');
      if (t['language:zh'] === 'yes') langs.push('zh');
      if (t['language:ko'] === 'yes') langs.push('ko');
      return {
        id: `${el.type}/${el.id}`,
        name: t['name:en'] || t.name || t['name:ja'] || 'Medical facility',
        nameJa: t['name:ja'] || t.name || '',
        lat: p.lat,
        lon: p.lon,
        amenity: t.amenity,
        phone: t.phone || t['contact:phone'] || '',
        website: t.website || t['contact:website'] || '',
        langs,
      };
    })
    .filter((c) => c.lat && c.lon);

  items.forEach((c) => {
    c.distance = Math.round(haversine(lat, lon, c.lat, c.lon));
  });
  items.sort((a, b) => a.distance - b.distance);
  return items;
}

// 公的な「外国語対応 医療機関」情報源へのリンク（言語対応の確認用）
export const OFFICIAL_DIRECTORIES = [
  {
    id: 'jnto',
    name: { ja: 'JNTO 医療機関検索（多言語）', en: 'JNTO Medical Institution Guide (multilingual)' },
    url: 'https://www.jnto.go.jp/emergency/eng/mi_guide.html',
  },
  {
    id: 'amda',
    name: { ja: 'AMDA 国際医療情報センター', en: 'AMDA International Medical Information Center' },
    url: 'https://www.amdamedicalcenter.com/',
  },
];

// 対応言語を各医療機関について確認するための外部検索リンク
export function verifyLanguageUrl(clinic, langLabel) {
  const q = encodeURIComponent(`${clinic.nameJa || clinic.name} ${langLabel} 対応`);
  return `https://www.google.com/search?q=${q}`;
}
