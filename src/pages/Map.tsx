import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's broken default icon under Vite (icons reference URLs that get mangled)
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
// @ts-expect-error — private Leaflet internals
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })

import { getLocationsWithFishFries } from '../lib/db'
import type { Location, FishFry, LocationWithFishFry } from '../lib/types'

// ── static coordinates (geocoded via Nominatim) ───────────────────────────────
// IDs 14 and 22 are approximate town-centre fallbacks.
const COORDS: Record<number, [number, number]> = {
  1:  [43.10487, -87.89639],  // Holy Family Parish
  2:  [43.01875, -88.05779],  // Mother of Perpetual Help Parish
  3:  [43.01870, -87.97015],  // Notre Dame School of Milwaukee
  4:  [42.77620, -87.80240],  // Northwest Parishes of Racine
  5:  [42.91921, -88.00076],  // Polish Center of Wisconsin
  6:  [43.03931, -87.95178],  // Pompeii Men's Club
  7:  [43.08413, -88.21275],  // Queen of Apostles Parish
  8:  [42.99848, -87.90464],  // St. Augustine of Hippo Parish
  9:  [43.00764, -87.99712],  // St. Barnabas
  10: [43.14413, -88.01328],  // St. Bernadette Parish
  11: [43.23507, -88.16217],  // St. Boniface Parish
  12: [43.08915, -88.13889],  // St. Dominic Parish
  13: [42.98718, -87.98965],  // St. Gregory the Great
  14: [42.87591, -88.35588],  // St. James the Less (approx — Mukwonago area)
  15: [42.96731, -88.02006],  // St. John the Evangelist
  16: [42.88273, -88.20311],  // St. Joseph Parish Big Bend
  17: [42.69650, -87.81258],  // St. Lucy Parish
  18: [42.97506, -88.37829],  // St. Paul Catholic Church
  19: [43.05354, -87.98106],  // St. Sebastian Parish
  20: [42.85719, -87.93554],  // St. Stephen Parish
  21: [42.87994, -88.47559],  // St. Theresa of Avila Church
  22: [42.80583, -88.20726],  // St. Thomas Aquinas Parish (approx — Waterford area)
}

const MKE_CENTER: [number, number] = [43.02, -88.05]

// ── helpers ───────────────────────────────────────────────────────────────────

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[+m]} ${+d}`
}

function formatDates(ff: FishFry): string {
  if (ff.is_recurring) {
    const s = ff.start_date ? shortDate(ff.start_date) : ''
    const e = ff.end_date   ? shortDate(ff.end_date)   : ''
    return `Every Friday, ${s}–${e}`
  }
  const dates: string[] = JSON.parse(ff.specific_dates ?? '[]')
  return dates.map(shortDate).join(', ')
}

// ── popup ─────────────────────────────────────────────────────────────────────

function LocationPopup({ loc, fishFries }: { loc: Location; fishFries: FishFry[] }) {
  const primary = fishFries[0]
  const browseLink = `/browse?q=${encodeURIComponent(loc.name)}`

  return (
    <div style={{ minWidth: 200, maxWidth: 260 }}>
      <div className="fw-bold" style={{ fontSize: '0.92rem' }}>{loc.name}</div>
      {loc.venue_notes && (
        <div className="text-muted" style={{ fontSize: '0.76rem' }}>{loc.venue_notes}</div>
      )}
      {loc.city && (
        <div className="text-muted" style={{ fontSize: '0.76rem' }}>{loc.city}, WI</div>
      )}

      <div className="d-flex flex-wrap gap-1 my-1">
        {!!primary.dine_in       && <span className="badge bg-primary"          style={{ fontSize: '0.65rem' }}>Dine-in</span>}
        {!!primary.carry_out     && <span className="badge bg-success"          style={{ fontSize: '0.65rem' }}>Carry-out</span>}
        {!!primary.drive_through && <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>Drive-through</span>}
      </div>

      <div style={{ fontSize: '0.82rem' }}>⏰ {primary.hours_open} – {primary.hours_close}</div>
      {primary.price_adult != null && (
        <div style={{ fontSize: '0.82rem' }}>💰 Adult ${primary.price_adult}</div>
      )}
      <div className="text-muted" style={{ fontSize: '0.76rem', marginTop: 2 }}>
        📅 {formatDates(primary)}
      </div>
      {fishFries.length > 1 && (
        <div className="text-muted" style={{ fontSize: '0.76rem' }}>
          +{fishFries.length - 1} more session this Lent
        </div>
      )}

      <Link to={browseLink} className="btn btn-sm btn-outline-primary mt-2 w-100" style={{ fontSize: '0.8rem' }}>
        View details →
      </Link>
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [data, setData]           = useState<LocationWithFishFry[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null)

  useEffect(() => {
    getLocationsWithFishFries()
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  // Group multiple fish_fry rows back to one entry per location
  const grouped = useMemo(() => {
    const map = new Map<number, { location: Location; fishFries: FishFry[] }>()
    for (const item of data) {
      if (!map.has(item.id)) {
        const { fishFry: _ff, ...location } = item
        map.set(item.id, { location, fishFries: [] })
      }
      map.get(item.id)!.fishFries.push(item.fishFry)
    }
    return Array.from(map.values())
  }, [data])

  const handleLocate = () => {
    if (!leafletMap) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => leafletMap.flyTo([coords.latitude, coords.longitude], 14, { animate: true, duration: 1.5 }),
      () => alert('Unable to retrieve your location.'),
    )
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted mt-2 small">Loading map…</p>
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-danger">Failed to load: {error}</div>
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-1">
        <h2 className="mb-0">Fish Fry Map</h2>
        <span className="text-muted small">{grouped.length} locations</span>
      </div>
      <p className="text-muted small mb-2">Tap a pin for details. Lenten Fridays 2026.</p>

      {/* wrapper gives us a positioning context for the overlay button */}
      <div style={{ position: 'relative' }}>
        <MapContainer
          ref={setLeafletMap}
          center={MKE_CENTER}
          zoom={11}
          style={{ height: 'calc(100vh - 56px - 9rem)', minHeight: 420, borderRadius: 8 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {grouped.map(({ location, fishFries }) => {
            const coords = COORDS[location.id]
            if (!coords) return null
            return (
              <Marker key={location.id} position={coords}>
                <Popup>
                  <LocationPopup loc={location} fishFries={fishFries} />
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* Locate-me button — overlaid in the bottom-right corner */}
        <button
          className="btn btn-primary btn-sm shadow"
          style={{ position: 'absolute', bottom: 20, right: 10, zIndex: 1000, whiteSpace: 'nowrap' }}
          onClick={handleLocate}
        >
          📍 My location
        </button>
      </div>
    </div>
  )
}
