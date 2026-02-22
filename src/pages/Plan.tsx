import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's broken default icon under Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
// @ts-expect-error — private Leaflet internals
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })

import { getLocationsWithFishFries } from '../lib/db'
import type { FishFry, LocationWithFishFry } from '../lib/types'
import { COORDS } from '../lib/coords'
import { usePlan } from '../lib/usePlan'
import { useFavorites } from '../lib/useFavorites'
import AddFishFryModal from '../components/AddFishFryModal'

// ── URL encoding ──────────────────────────────────────────────────────────────
// Format: "0:5,2:12" — Friday index (0-6) : location id

import type { PlanMap } from '../lib/usePlan'

function encodePlan(plan: PlanMap, fridays: { value: string }[]): string {
  return fridays
    .map((f, i) => plan[f.value] !== undefined ? `${i}:${plan[f.value]}` : null)
    .filter(Boolean)
    .join(',')
}

function decodePlan(encoded: string, fridays: { value: string }[]): PlanMap {
  const result: PlanMap = {}
  for (const part of encoded.split(',')) {
    const [idxStr, idStr] = part.split(':')
    const idx = parseInt(idxStr, 10)
    const id  = parseInt(idStr, 10)
    if (!isNaN(idx) && !isNaN(id) && fridays[idx]) {
      result[fridays[idx].value] = id
    }
  }
  return result
}

// ── constants ─────────────────────────────────────────────────────────────────

const LENTEN_FRIDAYS = [
  { label: 'Feb 20', value: '2026-02-20' },
  { label: 'Feb 27', value: '2026-02-27' },
  { label: 'Mar 6',  value: '2026-03-06' },
  { label: 'Mar 13', value: '2026-03-13' },
  { label: 'Mar 20', value: '2026-03-20' },
  { label: 'Mar 27', value: '2026-03-27' },
  { label: 'Apr 3',  value: '2026-04-03' },
]

const MKE_CENTER: [number, number] = [43.02, -88.05]

// ── helpers ───────────────────────────────────────────────────────────────────

function fishFryOnDate(ff: FishFry, date: string): boolean {
  if (ff.is_recurring) {
    return !!ff.start_date && !!ff.end_date &&
      date >= ff.start_date && date <= ff.end_date
  }
  const dates: string[] = JSON.parse(ff.specific_dates ?? '[]')
  return dates.includes(date)
}

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

const planPinIcon = makePinIcon('#10b981', '#059669')

// ── page ──────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const [data, setData]       = useState<LocationWithFishFry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null)

  const { plan, setPlanEntry, removePlanEntry, clearPlan, importPlan } = usePlan()
  const { favorites } = useFavorites()

  // Restore shared plan from URL on first load
  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get('plan')
    if (encoded) importPlan(decodePlan(encoded, LENTEN_FRIDAYS))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getLocationsWithFishFries()
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  // Map from fishFry.id → LocationWithFishFry (one entry per fish fry row)
  const fishFryById = useMemo(() => {
    const map = new Map<number, LocationWithFishFry>()
    for (const item of data) {
      if (!map.has(item.fishFry.id)) map.set(item.fishFry.id, item)
    }
    return map
  }, [data])

  // Available fish fries for the currently-active date
  const availableForDate = useMemo(() => {
    if (!activeDate) return []
    return data.filter(item => fishFryOnDate(item.fishFry, activeDate))
  }, [data, activeDate])

  // Plan entries that resolve to a known fish fry
  const plannedItems = useMemo(() => {
    return LENTEN_FRIDAYS
      .filter(f => plan[f.value] !== undefined && fishFryById.has(plan[f.value]))
      .map(f => ({ friday: f, item: fishFryById.get(plan[f.value])! }))
  }, [plan, fishFryById])

  const planCount = Object.keys(plan).length

  // Fit map to all planned markers whenever the plan or map instance changes
  useEffect(() => {
    if (!leafletMap) return
    const coords = plannedItems.map(({ item }) => COORDS[item.id]).filter(Boolean) as [number, number][]
    if (coords.length === 0) return
    if (coords.length === 1) {
      leafletMap.setView(coords[0], 13)
    } else {
      leafletMap.fitBounds(coords, { padding: [40, 40] })
    }
  }, [leafletMap, plannedItems])

  // Before printing: invalidate size so Leaflet redraws tiles at correct dimensions
  useEffect(() => {
    if (!leafletMap) return
    const refit = () => {
      leafletMap.invalidateSize()
      const coords = plannedItems.map(({ item }) => COORDS[item.id]).filter(Boolean) as [number, number][]
      if (coords.length === 1) leafletMap.setView(coords[0], 13)
      else if (coords.length > 1) leafletMap.fitBounds(coords, { padding: [40, 40] })
    }
    window.addEventListener('beforeprint', refit)
    return () => window.removeEventListener('beforeprint', refit)
  }, [leafletMap, plannedItems])

  async function handleShare() {
    // Encode plan into URL so it's shareable
    const encoded = encodePlan(plan, LENTEN_FRIDAYS)
    const url = new URL(window.location.href)
    url.searchParams.set('plan', encoded)
    history.replaceState(null, '', url.toString())

    const shareUrl = url.toString()
    const lines = LENTEN_FRIDAYS
      .filter(f => plan[f.value] !== undefined)
      .map(f => `${f.label}: ${fishFryById.get(plan[f.value])?.name ?? ''}`)

    if ('share' in navigator) {
      await navigator.share({ title: 'My Fish Fry Plan — Lent 2026', text: lines.join('\n'), url: shareUrl })
    } else {
      await (navigator as Navigator).clipboard.writeText(shareUrl)
      alert('Plan link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted mt-2 small">Loading…</p>
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-danger">Failed to load: {error}</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 no-print">
        <h2 className="mb-0">My Fish Fry Plan</h2>
        <div className="d-flex gap-2 align-items-center">
          {planCount > 0 && (
            <>
              <button className="btn btn-sm btn-outline-primary" onClick={handleShare}>
                Share
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
                Print
              </button>
            </>
          )}
          {planCount > 0 && (
            <button
              className="btn btn-sm btn-link text-danger p-0"
              onClick={clearPlan}
            >
              Clear plan
            </button>
          )}
        </div>
      </div>

      {/* Print header */}
      <div className="print-only mb-3">
        <h2>My Fish Fry Plan — Lent 2026</h2>
      </div>

      {/* Date list */}
      <ul className="list-group mb-4">
        {LENTEN_FRIDAYS.map(f => {
          const fishFryId = plan[f.value]
          const item = fishFryId !== undefined ? fishFryById.get(fishFryId) : undefined

          return (
            <li key={f.value} className="list-group-item d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ minWidth: '4.5rem' }}>{f.label}</span>
              <span className="flex-grow-1">
                {item ? (
                  <>
                    <span className="fw-medium">{item.name}</span>
                    {item.city && <span className="text-muted small ms-1">· {item.city}</span>}
                    {(item.fishFry.hours_open || item.fishFry.hours_close) && (
                      <span className="text-muted small ms-1">
                        · {item.fishFry.hours_open}–{item.fishFry.hours_close}
                      </span>
                    )}
                  </>
                ) : (
                  <em className="text-muted">None</em>
                )}
              </span>
              <div className="d-flex gap-1 no-print">
                <button
                  className="btn btn-sm btn-outline-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#addFishFryModal"
                  onClick={() => setActiveDate(f.value)}
                >
                  {item ? 'Change' : 'Add'}
                </button>
                {item && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removePlanEntry(f.value)}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* Map — visible on screen and in print */}
      {plannedItems.length > 0 && (
        <div className="mb-4">
          <MapContainer
            ref={setLeafletMap}
            center={MKE_CENTER}
            zoom={11}
            style={{ height: 400, borderRadius: 8 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {plannedItems.map(({ friday, item }) => {
              const coords = COORDS[item.id]
              if (!coords) return null
              return (
                <Marker key={friday.value} position={coords} icon={planPinIcon}>
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div className="fw-bold">{item.name}</div>
                      <div className="text-muted small">{friday.label}</div>
                      {(item.fishFry.hours_open || item.fishFry.hours_close) && (
                        <div className="small">{item.fishFry.hours_open}–{item.fishFry.hours_close}</div>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger mt-2 w-100"
                        onClick={() => removePlanEntry(friday.value)}
                      >
                        Remove from plan
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      )}

      {/* Empty state */}
      {planCount === 0 && (
        <div className="text-center text-muted py-4 no-print">
          <p className="mb-1">No fish fries planned yet.</p>
          <p className="small">Click "Add" next to a Friday to pick a fish fry for that date.</p>
        </div>
      )}

      {/* Modal — always in DOM */}
      <AddFishFryModal
        dateLabel={activeDate ? LENTEN_FRIDAYS.find(f => f.value === activeDate)?.label ?? activeDate : ''}
        available={availableForDate}
        favorites={favorites}
        currentFishFryId={activeDate ? plan[activeDate] : undefined}
        onSelect={id => activeDate && setPlanEntry(activeDate, id)}
        onClose={() => setActiveDate(null)}
      />
    </div>
  )
}
