import type { CivicArea, CivicLocation, LocationType } from '@/types/civic'
import { haversineKm } from '@/utils/geo'

export const LOCATION_TYPE_META: Record<LocationType, { icon: string; label: string }> = {
  locality: { icon: '📍', label: 'Locality' },
  railway_station: { icon: '🚉', label: 'Railway Station' },
  metro: { icon: '🚇', label: 'Metro' },
  hospital: { icon: '🏥', label: 'Hospital' },
  school: { icon: '🏫', label: 'School / College' },
  road: { icon: '🛣', label: 'Road' },
  market: { icon: '🛍', label: 'Market' },
  landmark: { icon: '🏛', label: 'Civic Landmark' },
}

const L = (
  id: string,
  name: string,
  area: string,
  lat: number,
  lng: number,
  type: LocationType,
  pincode: string,
  keywords: string[] = [],
): CivicLocation => ({
  id,
  name,
  area,
  city: 'Mumbai',
  state: 'Maharashtra',
  lat,
  lng,
  type,
  pincode,
  keywords,
})

const EAST = ['east', 'e']
const WEST = ['west', 'w']
const STN = ['station', 'railway station', 'stn']
const METRO = ['metro', 'metro station']

export const DEFAULT_LOCATION: CivicLocation = L(
  'bandra-w',
  'Bandra West',
  'Bandra',
  19.0596,
  72.8295,
  'locality',
  '400050',
  [...WEST],
)

export const MUMBAI_LOCATIONS: CivicLocation[] = [
  // ---------------- Bandra ----------------
  L('bandra-w', 'Bandra West', 'Bandra', 19.0596, 72.8295, 'locality', '400050', [...WEST]),
  L('bandra-e', 'Bandra East', 'Bandra', 19.0596, 72.8434, 'locality', '400051', [...EAST]),
  L('bandra-stn', 'Bandra Railway Station', 'Bandra East', 19.0616, 72.841, 'railway_station', '400051', [...STN]),
  L('bandra-market', 'Bandra Market', 'Bandra West', 19.0546, 72.8386, 'market', '400050', ['market', 'bandra bazaar']),
  L('bandra-fort', 'Bandra Fort', 'Bandra West', 19.0418, 72.8165, 'landmark', '400050', ['fort', 'castella de aquada']),
  L('pali-hill', 'Pali Hill', 'Bandra West', 19.0661, 72.8263, 'locality', '400050', ['pali', 'hill']),
  L('hill-road', 'Hill Road', 'Bandra West', 19.0601, 72.83, 'road', '400050', ['hill road']),
  L('linking-road', 'Linking Road', 'Bandra West', 19.057, 72.8318, 'road', '400050', ['linking road', 'link']),
  L('carter-road', 'Carter Road Promenade', 'Bandra West', 19.0458, 72.8218, 'road', '400050', ['carter road', 'seaface']),
  L('waterfield-road', 'Waterfield Road', 'Bandra West', 19.0565, 72.8399, 'road', '400050', ['waterfield road']),
  L('khar-danda', 'Khar Danda', 'Bandra West', 19.0689, 72.8301, 'locality', '400050', ['khar danda', 'fishing village']),
  L('lilavati-hospital', 'Lilavati Hospital', 'Bandra West', 19.0599, 72.8269, 'hospital', '400050', ['lilavati', 'hospital']),
  L('bkc', 'Bandra Kurla Complex', 'Bandra East', 19.0683, 72.8666, 'landmark', '400051', ['bkc', 'bandra kurla complex']),

  // ---------------- Andheri ----------------
  L('andheri-e', 'Andheri East', 'Andheri', 19.1136, 72.8697, 'locality', '400069', [...EAST]),
  L('andheri-w', 'Andheri West', 'Andheri', 19.1191, 72.8399, 'locality', '400058', [...WEST]),
  L('andheri-stn', 'Andheri Railway Station', 'Andheri West', 19.1197, 72.8465, 'railway_station', '400058', [...STN]),
  L('andheri-metro', 'Andheri Metro Station', 'Andheri West', 19.115, 72.852, 'metro', '400058', [...METRO]),
  L('dn-nagar-metro', 'DN Nagar Metro Station', 'Andheri West', 19.1198, 72.8323, 'metro', '400058', [...METRO]),
  L('marol', 'Marol', 'Andheri East', 19.1129, 72.8778, 'locality', '400059', ['marol']),
  L('marol-naka', 'Marol Naka', 'Andheri East', 19.1122, 72.8758, 'locality', '400059', ['marol naka']),
  L('lokhandwala', 'Lokhandwala Complex', 'Andheri West', 19.1203, 72.8398, 'locality', '400053', ['lokhandwala']),
  L('chakala', 'Chakala', 'Andheri East', 19.1108, 72.8561, 'locality', '400099', ['chakala']),
  L('midc', 'MIDC Andheri', 'Andheri East', 19.112, 72.876, 'locality', '400093', ['midc']),
  L('saki-naka', 'Saki Naka', 'Andheri East', 19.105, 72.884, 'locality', '400072', ['saki naka']),
  L('sevenhills-hospital', 'SevenHills Hospital', 'Andheri East', 19.122, 72.868, 'hospital', '400061', ['sevenhills', 'hospital']),
  L('jhonson-hospital', 'Dr. R.N. Cooper Hospital', 'Vile Parle West', 19.105, 72.84, 'hospital', '400056', ['cooper hospital', 'cooper']),

  // ---------------- Powai ----------------
  L('powai', 'Powai', 'Powai', 19.1176, 72.906, 'locality', '400076', ['powai']),
  L('hiranandani', 'Hiranandani Gardens', 'Powai', 19.1163, 72.9095, 'locality', '400076', ['hiranandani']),
  L('iit-bombay', 'IIT Bombay', 'Powai', 19.1334, 72.9133, 'school', '400076', ['iit', 'iit bombay', 'college']),
  L('powai-lake', 'Powai Lake', 'Powai', 19.1284, 72.9058, 'landmark', '400076', ['powai lake']),

  // ---------------- Malad ----------------
  L('malad-w', 'Malad West', 'Malad', 19.1856, 72.8489, 'locality', '400064', [...WEST]),
  L('malad-e', 'Malad East', 'Malad', 19.18, 72.87, 'locality', '400097', [...EAST]),
  L('malad-stn', 'Malad Railway Station', 'Malad West', 19.1888, 72.851, 'railway_station', '400064', [...STN]),
  L('malad-market', 'Malad Market', 'Malad West', 19.186, 72.849, 'market', '400064', ['malad market', 'market']),

  // ---------------- Khar ----------------
  L('khar-w', 'Khar West', 'Khar', 19.0714, 72.8332, 'locality', '400052', [...WEST]),
  L('khar-e', 'Khar East', 'Khar', 19.0714, 72.844, 'locality', '400051', [...EAST]),
  L('khar-stn', 'Khar Railway Station', 'Khar', 19.0725, 72.8395, 'railway_station', '400052', [...STN]),

  // ---------------- Santacruz ----------------
  L('santacruz-w', 'Santacruz West', 'Santacruz', 19.083, 72.838, 'locality', '400054', [...WEST]),
  L('santacruz-e', 'Santacruz East', 'Santacruz', 19.083, 72.852, 'locality', '400055', [...EAST]),
  L('santacruz-stn', 'Santacruz Railway Station', 'Santacruz', 19.0837, 72.8422, 'railway_station', '400054', [...STN]),

  // ---------------- Vile Parle ----------------
  L('vileparle-w', 'Vile Parle West', 'Vile Parle', 19.0999, 72.842, 'locality', '400056', [...WEST]),
  L('vileparle-e', 'Vile Parle East', 'Vile Parle', 19.0999, 72.852, 'locality', '400057', [...EAST]),
  L('vileparle-stn', 'Vile Parle Railway Station', 'Vile Parle', 19.0996, 72.8465, 'railway_station', '400056', [...STN]),

  // ---------------- Jogeshwari ----------------
  L('jogeshwari-w', 'Jogeshwari West', 'Jogeshwari', 19.134, 72.843, 'locality', '400102', [...WEST]),
  L('jogeshwari-e', 'Jogeshwari East', 'Jogeshwari', 19.134, 72.858, 'locality', '400060', [...EAST]),
  L('sv-road', 'S.V. Road', 'Jogeshwari', 19.124, 72.844, 'road', '400102', ['sv road', 's.v. road']),

  // ---------------- Goregaon ----------------
  L('goregaon-w', 'Goregaon West', 'Goregaon', 19.1645, 72.848, 'locality', '400062', [...WEST]),
  L('goregaon-e', 'Goregaon East', 'Goregaon', 19.1645, 72.862, 'locality', '400063', [...EAST]),
  L('film-city', 'Film City', 'Goregaon East', 19.1572, 72.8705, 'landmark', '400065', ['film city', 'goregaon film city']),
  L('goregaon-stn', 'Goregaon Railway Station', 'Goregaon West', 19.1645, 72.848, 'railway_station', '400062', [...STN]),

  // ---------------- Kandivali ----------------
  L('kandivali-w', 'Kandivali West', 'Kandivali', 19.2, 72.839, 'locality', '400067', [...WEST]),
  L('kandivali-e', 'Kandivali East', 'Kandivali', 19.2, 72.855, 'locality', '400101', [...EAST]),

  // ---------------- Borivali ----------------
  L('borivali-w', 'Borivali West', 'Borivali', 19.229, 72.843, 'locality', '400092', [...WEST]),
  L('borivali-e', 'Borivali East', 'Borivali', 19.229, 72.859, 'locality', '400066', [...EAST]),
  L('borivali-stn', 'Borivali Railway Station', 'Borivali West', 19.229, 72.843, 'railway_station', '400092', [...STN]),

  // ---------------- Kurla ----------------
  L('kurla-w', 'Kurla West', 'Kurla', 19.075, 72.885, 'locality', '400070', [...WEST]),
  L('kurla-e', 'Kurla East', 'Kurla', 19.073, 72.895, 'locality', '400024', [...EAST]),
  L('ltt-terminus', 'Lokmanya Tilak Terminus', 'Kurla West', 19.075, 72.885, 'railway_station', '400070', ['ltt', 'lokmanya tilak', ...STN]),
  L('kurla-stn', 'Kurla Railway Station', 'Kurla', 19.075, 72.885, 'railway_station', '400070', [...STN]),

  // ---------------- Ghatkopar ----------------
  L('ghatkopar-w', 'Ghatkopar West', 'Ghatkopar', 19.0865, 72.9074, 'locality', '400086', [...WEST]),
  L('ghatkopar-e', 'Ghatkopar East', 'Ghatkopar', 19.0865, 72.918, 'locality', '400077', [...EAST]),
  L('ghatkopar-stn', 'Ghatkopar Railway Station', 'Ghatkopar West', 19.0865, 72.9074, 'railway_station', '400086', [...STN]),
  L('ghatkopar-metro', 'Ghatkopar Metro Station', 'Ghatkopar West', 19.0865, 72.9074, 'metro', '400086', [...METRO]),

  // ---------------- Chembur ----------------
  L('chembur', 'Chembur', 'Chembur', 19.0448, 72.8955, 'locality', '400071', ['chembur']),
  L('chembur-naka', 'Chembur Naka', 'Chembur', 19.0448, 72.8955, 'locality', '400071', ['chembur naka']),

  // ---------------- Sion / Matunga ----------------
  L('sion', 'Sion', 'Sion', 19.0406, 72.8614, 'locality', '400022', ['sion']),
  L('matunga', 'Matunga', 'Matunga', 19.0225, 72.8522, 'locality', '400019', ['matunga']),
  L('matunga-market', 'Matunga Market', 'Matunga', 19.0225, 72.8522, 'market', '400019', ['matunga market']),

  // ---------------- Dadar ----------------
  L('dadar-w', 'Dadar West', 'Dadar', 19.0175, 72.8471, 'locality', '400028', [...WEST]),
  L('dadar-e', 'Dadar East', 'Dadar', 19.0169, 72.858, 'locality', '400014', [...EAST]),
  L('dadar-stn', 'Dadar Railway Station', 'Dadar West', 19.0175, 72.8471, 'railway_station', '400028', [...STN]),

  // ---------------- Worli ----------------
  L('worli', 'Worli', 'Worli', 19.011, 72.816, 'locality', '400030', ['worli']),
  L('haji-ali', 'Haji Ali Dargah', 'Worli', 18.9826, 72.8106, 'landmark', '400030', ['haji ali']),
  L('worli-sea-link', 'Bandra-Worli Sea Link', 'Worli', 19.03, 72.819, 'road', '400030', ['sea link', 'bandra worli sea link']),

  // ---------------- Lower Parel / Parel ----------------
  L('lower-parel', 'Lower Parel', 'Lower Parel', 18.996, 72.827, 'locality', '400013', ['lower parel']),
  L('parel', 'Parel', 'Parel', 19.01, 72.844, 'locality', '400012', ['parel']),
  L('phoenix-mills', 'Phoenix Palladium', 'Lower Parel', 18.996, 72.827, 'market', '400013', ['phoenix', 'mall']),

  // ---------------- South Mumbai ----------------
  L('colaba', 'Colaba', 'Colaba', 18.9067, 72.8147, 'locality', '400005', ['colaba']),
  L('gateway-india', 'Gateway of India', 'Colaba', 18.9219, 72.8346, 'landmark', '400001', ['gateway of india', 'gateway']),
  L('fort', 'Fort', 'Fort', 18.933, 72.834, 'locality', '400001', ['fort']),
  L('churchgate', 'Churchgate', 'Churchgate', 18.933, 72.828, 'locality', '400020', ['churchgate']),
  L('marine-lines', 'Marine Lines', 'Marine Lines', 18.944, 72.824, 'locality', '400020', ['marine lines']),
  L('cuffe-parade', 'Cuffe Parade', 'Cuffe Parade', 18.9087, 72.826, 'locality', '400005', ['cuffe parade']),
  L('crawford-market', 'Crawford Market', 'Fort', 18.9467, 72.8339, 'market', '400001', ['crawford market']),

  // ---------------- Roads / infrastructure ----------------
  L('western-express', 'Western Express Highway', 'Western Suburbs', 19.1, 72.855, 'road', '400001', ['western express highway', 'weh']),
  L('eastern-express', 'Eastern Express Highway', 'Eastern Suburbs', 19.05, 72.885, 'road', '400001', ['eastern express highway', 'eeh']),
  L('jvlr', 'Jogeshwari–Vikhroli Link Road', 'Jogeshwari', 19.13, 72.86, 'road', '400060', ['jvlr', 'jogeshwari vikhroli link road']),
  L('jvpd', 'Juhu–Versova Link Road', 'Andheri West', 19.12, 72.835, 'road', '400053', ['jvpd', 'juhu versova link road']),
]

export function searchLocations(query: string, limit = 8): CivicLocation[] {
  const q = norm(query)
  if (!q) return []
  const tokens = q.split(' ').filter(Boolean)
  const scored: { loc: CivicLocation; score: number }[] = []
  for (const loc of MUMBAI_LOCATIONS) {
    const hay = searchable(loc)
    const hayWords = hay.split(' ')
    const allMatch = tokens.every(
      (tok) => hay.includes(tok) || hayWords.some((w) => w.startsWith(tok)),
    )
    if (!allMatch) continue
    let score = 0
    const nameNorm = norm(loc.name)
    const areaNorm = norm(loc.area)
    if (nameNorm === q) score += 100
    else if (nameNorm.startsWith(q)) score += 60
    else if (nameNorm.includes(q)) score += 40
    else if (areaNorm === q) score += 30
    else if (areaNorm.startsWith(q)) score += 20
    else if (areaNorm.includes(q)) score += 10
    if (loc.type === 'locality') score += 5
    scored.push({ loc, score })
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.loc)
}

export function findNearestLocation(lat: number, lng: number): CivicLocation {
  let best = DEFAULT_LOCATION
  let bestD = Infinity
  for (const loc of MUMBAI_LOCATIONS) {
    const d = haversineKm(lat, lng, loc.lat, loc.lng)
    if (d < bestD) {
      bestD = d
      best = loc
    }
  }
  return best
}

export function locationLabel(loc: CivicLocation): string {
  if (loc.type === 'locality') return `${loc.name}, ${loc.city}`
  return `${loc.name}, ${loc.area}, ${loc.city}`
}

export function civicLocationToArea(loc: CivicLocation): CivicArea {
  return {
    id: loc.id,
    name: loc.area,
    city: loc.city,
    pincode: loc.pincode ?? '400001',
    lat: loc.lat,
    lng: loc.lng,
    landmark: loc.name,
    zones: [loc.name],
  }
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function searchable(loc: CivicLocation): string {
  return norm(
    `${loc.name} ${loc.area} ${loc.city} ${loc.state} ${loc.pincode ?? ''} ${(loc.keywords ?? []).join(' ')}`,
  )
}
