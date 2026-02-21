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
import { COORDS } from '../lib/coords'
import { useFavorites } from '../lib/useFavorites'

// ── fish icon (matches Browse page) ──────────────────────────────────────────

function FishIcon({ filled }: { filled: boolean }) {
  const fill    = filled ? '#f59e0b' : 'none'
  const stroke  = filled ? '#b45309' : '#9ca3af'
  const eyeFill = filled ? '#78350f' : '#9ca3af'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 20"
      width="20"
      height="20"
      style={{ display: 'block', transition: 'all 0.18s ease' }}
      aria-hidden="true"
    >
      <path d="M 8 10 L 2 4 L 4 10 L 2 16 Z" fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M 8 10 C 8 4 14 2 20 2 C 28 2 31 6 31 10 C 31 14 28 18 20 18 C 14 18 8 16 8 10 Z" fill={fill} stroke={stroke} strokeWidth="1.4" />
      <circle cx="25" cy="8.5" r="1.6" fill={filled ? 'rgba(255,255,255,0.7)' : 'none'} />
      <circle cx="25" cy="8.5" r="0.85" fill={eyeFill} />
    </svg>
  )
}

// ── custom map markers ────────────────────────────────────────────────────────

function makePinIcon(color: string, outline: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
    <path d="M12.5 0C5.597 0 0 5.597 0 12.5c0 9.374 12.5 28.5 12.5 28.5S25 21.874 25 12.5C25 5.597 19.403 0 12.5 0z"
      fill="${color}" stroke="${outline}" stroke-width="1.5"/>
    <circle cx="12.5" cy="12.5" r="5" fill="white" opacity="0.85"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })
}

const defaultPinIcon  = makePinIcon('#3b82f6', '#1d4ed8')
const favoritePinIcon = makePinIcon('#f59e0b', '#b45309')

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

function LocationPopup({
  loc, fishFries, isFavorite, onToggleFavorite,
}: {
  loc: Location
  fishFries: FishFry[]
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const primary = fishFries[0]
  const browseLink = `/browse?q=${encodeURIComponent(loc.name)}`

  return (
    <div style={{ minWidth: 200, maxWidth: 260 }}>
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div className="fw-bold" style={{ fontSize: '0.92rem' }}>{loc.name}</div>
        <button
          onClick={onToggleFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
            opacity: isFavorite ? 1 : 0.45, lineHeight: 1,
          }}
        >
          <FishIcon filled={isFavorite} />
        </button>
      </div>
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
  const { favorites, toggle } = useFavorites()

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
      <div className="d-flex align-items-center gap-3 mb-2">
        <p className="text-muted small mb-0">Tap a pin for details. Lenten Fridays 2026.</p>
        {favorites.size > 0 && (
          <span className="d-flex align-items-center gap-1 small">
            <span style={{
              display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
              background: '#f59e0b', border: '1.5px solid #b45309', flexShrink: 0,
            }} />
            <span className="text-muted">{favorites.size} favorited</span>
          </span>
        )}
      </div>

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
            const isFav = favorites.has(location.id)
            return (
              <Marker
                key={location.id}
                position={coords}
                icon={isFav ? favoritePinIcon : defaultPinIcon}
                zIndexOffset={isFav ? 1000 : 0}
              >
                <Popup>
                  <LocationPopup
                    loc={location}
                    fishFries={fishFries}
                    isFavorite={isFav}
                    onToggleFavorite={() => toggle(location.id)}
                  />
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
