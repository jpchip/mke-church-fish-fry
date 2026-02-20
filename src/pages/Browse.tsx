import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLocationsWithFishFries } from '../lib/db'
import type { LocationWithFishFry, FishFry } from '../lib/types'
import { COORDS, distanceMi } from '../lib/coords'
import { useFavorites } from '../lib/useFavorites'

const LENTEN_FRIDAYS = [
  { label: 'Feb 20', value: '2026-02-20' },
  { label: 'Feb 27', value: '2026-02-27' },
  { label: 'Mar 6',  value: '2026-03-06' },
  { label: 'Mar 13', value: '2026-03-13' },
  { label: 'Mar 20', value: '2026-03-20' },
  { label: 'Mar 27', value: '2026-03-27' },
  { label: 'Apr 3',  value: '2026-04-03' },
]

// ── helpers ─────────────────────────────────────────────────────────────────

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[+m]} ${+d}`
}

function formatDates(ff: FishFry): string {
  if (ff.is_recurring) {
    const s = ff.start_date ? shortDate(ff.start_date) : ''
    const e = ff.end_date   ? shortDate(ff.end_date)   : ''
    return `Every Friday, ${s} – ${e}`
  }
  const dates: string[] = JSON.parse(ff.specific_dates ?? '[]')
  return dates.map(shortDate).join(', ')
}

function formatPrices(ff: FishFry): string {
  const parts: string[] = []
  if (ff.price_adult  != null) parts.push(`Adult $${ff.price_adult}`)
  if (ff.price_child  != null) parts.push(`Child $${ff.price_child}`)
  if (ff.price_senior != null) parts.push(`Senior $${ff.price_senior}`)
  if (ff.price_family != null) parts.push(`Family $${ff.price_family}`)
  return parts.join(' · ')
}

function mapsUrl(item: LocationWithFishFry): string {
  const q = [item.address, item.city, 'WI'].filter(Boolean).join(', ')
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`
}

// ── fish icon ────────────────────────────────────────────────────────────────

function FishIcon({ filled }: { filled: boolean }) {
  const fill   = filled ? '#f59e0b' : 'none'
  const stroke = filled ? '#b45309' : '#9ca3af'
  const eyeFill = filled ? '#78350f' : '#9ca3af'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 20"
      width="22"
      height="22"
      style={{ display: 'block', transition: 'all 0.18s ease' }}
      aria-hidden="true"
    >
      {/* tail fin */}
      <path
        d="M 8 10 L 2 4 L 4 10 L 2 16 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* body */}
      <path
        d="M 8 10 C 8 4 14 2 20 2 C 28 2 31 6 31 10 C 31 14 28 18 20 18 C 14 18 8 16 8 10 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.4"
      />
      {/* eye */}
      <circle cx="25" cy="8.5" r="1.6" fill={filled ? 'rgba(255,255,255,0.7)' : 'none'} />
      <circle cx="25" cy="8.5" r="0.85" fill={eyeFill} />
    </svg>
  )
}

// ── card ─────────────────────────────────────────────────────────────────────

function FishFryCard({
  item,
  distMi,
  isFavorite,
  onToggleFavorite,
}: {
  item: LocationWithFishFry
  distMi?: number
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const ff = item.fishFry

  const fishTypes = ff.fish_types?.split(', ').filter(Boolean) ?? []
  const sides      = ff.sides?.split(', ').filter(Boolean) ?? []
  const price      = formatPrices(ff)
  const dates      = formatDates(ff)
  const locationLine = [
    item.venue_notes,
    item.city ? `${item.city}, WI` : 'WI',
    distMi != null ? `${distMi.toFixed(1)} mi` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="card h-100 shadow-sm" style={{ position: 'relative' }}>
      {/* Favorite fish button */}
      <button
        onClick={() => onToggleFavorite(item.id)}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-label={isFavorite ? `Remove ${item.name} from favorites` : `Favorite ${item.name}`}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          padding: 2,
          cursor: 'pointer',
          zIndex: 1,
          lineHeight: 0,
          opacity: isFavorite ? 1 : 0.45,
          transition: 'opacity 0.18s ease',
        }}
        onMouseEnter={e => { if (!isFavorite) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
        onMouseLeave={e => { if (!isFavorite) (e.currentTarget as HTMLButtonElement).style.opacity = '0.45' }}
      >
        <FishIcon filled={isFavorite} />
      </button>

      <div className="card-body d-flex flex-column gap-2">

        {/* Name + location */}
        <div style={{ paddingRight: 28 }}>
          <h6 className="mb-0 fw-bold">{item.name}</h6>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{locationLine}</div>
        </div>

        {/* Service badges */}
        <div className="d-flex flex-wrap gap-1">
          {!!ff.dine_in      && <span className="badge bg-primary">Dine-in</span>}
          {!!ff.carry_out    && <span className="badge bg-success">Carry-out</span>}
          {!!ff.drive_through && <span className="badge bg-warning text-dark">Drive-through</span>}
        </div>

        {/* Hours */}
        <div className="small">
          ⏰ <strong>{ff.hours_open}</strong> – <strong>{ff.hours_close}</strong>
        </div>

        {/* Fish types */}
        {fishTypes.length > 0 && (
          <div className="d-flex flex-wrap gap-1 align-items-center">
            <span className="small">🐟</span>
            {fishTypes.map(f => (
              <span key={f} className="badge bg-secondary-subtle text-secondary-emphasis border" style={{ fontSize: '0.7rem' }}>
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Sides */}
        {sides.length > 0 && (
          <div className="text-muted" style={{ fontSize: '0.78rem' }}>
            Sides: {sides.join(', ')}
          </div>
        )}

        {/* Price */}
        {price && (
          <div className="small">💰 {price}</div>
        )}

        {/* Drinks + dessert */}
        {(!!ff.drinks_included || !!ff.drinks_purchase || !!ff.dessert_included) && (
          <div className="text-muted" style={{ fontSize: '0.78rem' }}>
            {ff.drinks_included  && <span className="me-2">🥤 {ff.drinks_included} incl.</span>}
            {ff.drinks_purchase  && <span className="me-2">🍺 {ff.drinks_purchase} for purchase</span>}
            {!!ff.dessert_included && <span>🍰 Dessert incl.</span>}
          </div>
        )}

        {/* Dates */}
        <div className="small text-muted">📅 {dates}</div>

        {/* Contact row */}
        <div className="d-flex flex-wrap gap-3 small mt-auto">
          {item.address && (
            <a href={mapsUrl(item)} target="_blank" rel="noreferrer" className="text-decoration-none text-muted">
              📍 {item.address}
            </a>
          )}
          {item.phone && (
            <a href={`tel:${item.phone}`} className="text-decoration-none">
              📞 {item.phone}
            </a>
          )}
          {item.website && (
            <a href={item.website} target="_blank" rel="noreferrer" className="text-decoration-none">
              🌐 Website
            </a>
          )}
        </div>

        {/* Expandable description */}
        <div>
          <button
            className="btn btn-link btn-sm p-0 text-muted"
            style={{ fontSize: '0.78rem' }}
            onClick={() => setExpanded(x => !x)}
          >
            {expanded ? 'Hide description ▲' : 'Full description ▼'}
          </button>
          {expanded && (
            <p className="small text-muted mt-1 mb-0">{ff.description}</p>
          )}
        </div>

      </div>
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function Browse() {
  const [searchParams] = useSearchParams()
  const { favorites, toggle: toggleFavorite } = useFavorites()

  const [data, setData]       = useState<LocationWithFishFry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [search,            setSearch]            = useState(searchParams.get('q') ?? '')
  const [dateFilter,        setDateFilter]        = useState('')
  const [dineIn,            setDineIn]            = useState(false)
  const [carryOut,          setCarryOut]          = useState(false)
  const [drivethru,         setDrivethru]         = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [sortBy,            setSortBy]            = useState<'name' | 'distance'>('name')
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)
  const [locating,   setLocating]   = useState(false)

  useEffect(() => {
    getLocationsWithFishFries()
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return data.filter(item => {
      const ff = item.fishFry

      // Favorites filter
      if (showFavoritesOnly && !favorites.has(item.id)) return false

      // Date filter
      if (dateFilter) {
        if (ff.is_recurring) {
          if (!ff.start_date || !ff.end_date) return false
          if (dateFilter < ff.start_date || dateFilter > ff.end_date) return false
        } else {
          const dates: string[] = JSON.parse(ff.specific_dates ?? '[]')
          if (!dates.includes(dateFilter)) return false
        }
      }

      // Service filter — OR among checked boxes
      const anyService = dineIn || carryOut || drivethru
      if (anyService) {
        const ok = (dineIn && !!ff.dine_in) || (carryOut && !!ff.carry_out) || (drivethru && !!ff.drive_through)
        if (!ok) return false
      }

      // Text search across name, city, and fish types
      if (search.trim()) {
        const q = search.toLowerCase()
        const hay = `${item.name} ${item.city ?? ''} ${ff.fish_types ?? ''} ${ff.sides ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }

      return true
    })
  }, [data, dateFilter, dineIn, carryOut, drivethru, search, showFavoritesOnly, favorites])

  // Sorted view — distance sort only kicks in once we have user coords
  const sorted = useMemo(() => {
    if (sortBy === 'name' || !userCoords) return filtered
    const [uLat, uLon] = userCoords
    return [...filtered].sort((a, b) => {
      const ca = COORDS[a.id]
      const cb = COORDS[b.id]
      if (!ca && !cb) return 0
      if (!ca) return 1
      if (!cb) return -1
      return distanceMi(uLat, uLon, ca[0], ca[1]) - distanceMi(uLat, uLon, cb[0], cb[1])
    })
  }, [filtered, sortBy, userCoords])

  const handleSortByDistance = () => {
    if (userCoords) {
      setSortBy('distance')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoords([coords.latitude, coords.longitude])
        setSortBy('distance')
        setLocating(false)
      },
      () => {
        setLocating(false)
        alert('Unable to retrieve your location.')
      },
    )
  }

  const clearFilters = () => {
    setSearch('')
    setDateFilter('')
    setDineIn(false)
    setCarryOut(false)
    setDrivethru(false)
    setShowFavoritesOnly(false)
    setSortBy('name')
  }

  const hasFilters = search || dateFilter || dineIn || carryOut || drivethru || showFavoritesOnly || sortBy === 'distance'

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
        <p className="text-muted mt-2 small">Loading fish fries…</p>
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-danger">Failed to load: {error}</div>
  }

  return (
    <div>
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h2 className="mb-0">Browse Fish Fries</h2>
        <span className="text-muted small">{sorted.length} / {data.length}</span>
      </div>

      {/* ── filter bar ── */}
      <div className="card bg-body-secondary border-0 mb-3">
        <div className="card-body pb-2">
          <div className="row g-2 align-items-end">

            {/* Search */}
            <div className="col-12 col-sm-5">
              <label className="form-label small fw-semibold mb-1">Search</label>
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Name, city, fish type, side…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="col-7 col-sm-4">
              <label className="form-label small fw-semibold mb-1">Friday</label>
              <select
                className="form-select form-select-sm"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              >
                <option value="">All dates</option>
                {LENTEN_FRIDAYS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Clear (only when filters active) */}
            <div className="col-5 col-sm-3 d-flex align-items-end justify-content-end">
              {hasFilters && (
                <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                  Clear
                </button>
              )}
            </div>

            {/* Service toggles + Sort — same row on mobile */}
            <div className="col-12 d-flex flex-wrap gap-3">
              <div>
                <div className="small fw-semibold mb-1">Service type</div>
                <div className="d-flex gap-2 flex-wrap">
                  {(
                    [
                      { label: 'Dine-in',       state: dineIn,    set: setDineIn },
                      { label: 'Carry-out',     state: carryOut,  set: setCarryOut },
                      { label: 'Drive-through', state: drivethru, set: setDrivethru },
                    ] as const
                  ).map(({ label, state, set }) => (
                    <button
                      key={label}
                      className={`btn btn-sm ${state ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => set(v => !v)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="small fw-semibold mb-1">Sort</div>
                <div className="d-flex gap-2">
                  <button
                    className={`btn btn-sm ${sortBy === 'name' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setSortBy('name')}
                  >
                    Name
                  </button>
                  <button
                    className={`btn btn-sm ${sortBy === 'distance' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={handleSortByDistance}
                    disabled={locating}
                  >
                    {locating
                      ? <><span className="spinner-border spinner-border-sm me-1" />Locating…</>
                      : '📍 Near me'}
                  </button>
                </div>
              </div>

              <div className="ms-auto">
                <div className="small fw-semibold mb-1">Favorites</div>
                <button
                  className={`btn btn-sm d-flex align-items-center gap-1 ${showFavoritesOnly ? 'btn-warning' : 'btn-outline-secondary'}`}
                  onClick={() => setShowFavoritesOnly(v => !v)}
                >
                  <FishIcon filled={showFavoritesOnly} />
                  {showFavoritesOnly ? `Only favorites (${favorites.size})` : 'All locations'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── results ── */}
      {sorted.length === 0 ? (
        <div className="alert alert-info">
          No fish fries match your filters.{' '}
          <button className="btn btn-link p-0 alert-link" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <div className="row g-3">
          {sorted.map(item => {
            const coords = userCoords && sortBy === 'distance' ? COORDS[item.id] : undefined
            const dist = coords ? distanceMi(userCoords![0], userCoords![1], coords[0], coords[1]) : undefined
            return (
              <div key={item.fishFry.id} className="col-12 col-md-6 col-xl-4">
                <FishFryCard
                  item={item}
                  distMi={dist}
                  isFavorite={favorites.has(item.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
