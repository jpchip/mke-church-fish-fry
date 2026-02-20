import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLocationsWithFishFries } from '../lib/db'
import type { LocationWithFishFry, FishFry } from '../lib/types'

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

// ── card ─────────────────────────────────────────────────────────────────────

function FishFryCard({ item }: { item: LocationWithFishFry }) {
  const [expanded, setExpanded] = useState(false)
  const ff = item.fishFry

  const fishTypes = ff.fish_types?.split(', ').filter(Boolean) ?? []
  const sides      = ff.sides?.split(', ').filter(Boolean) ?? []
  const price      = formatPrices(ff)
  const dates      = formatDates(ff)
  const locationLine = [item.venue_notes, item.city ? `${item.city}, WI` : 'WI']
    .filter(Boolean).join(' · ')

  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body d-flex flex-column gap-2">

        {/* Name + location */}
        <div>
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
              <span key={f} className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
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
        {(ff.drinks_included || ff.drinks_purchase || ff.dessert_included) && (
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

  const [data, setData]       = useState<LocationWithFishFry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [search,     setSearch]     = useState(searchParams.get('q') ?? '')
  const [dateFilter, setDateFilter] = useState('')
  const [dineIn,     setDineIn]     = useState(false)
  const [carryOut,   setCarryOut]   = useState(false)
  const [drivethru,  setDrivethru]  = useState(false)

  useEffect(() => {
    getLocationsWithFishFries()
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return data.filter(item => {
      const ff = item.fishFry

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
        const hay = `${item.name} ${item.city ?? ''} ${ff.fish_types ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }

      return true
    })
  }, [data, dateFilter, dineIn, carryOut, drivethru, search])

  const clearFilters = () => {
    setSearch('')
    setDateFilter('')
    setDineIn(false)
    setCarryOut(false)
    setDrivethru(false)
  }

  const hasFilters = search || dateFilter || dineIn || carryOut || drivethru

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
        <span className="text-muted small">{filtered.length} / {data.length}</span>
      </div>

      {/* ── filter bar ── */}
      <div className="card bg-light border-0 mb-3">
        <div className="card-body pb-2">
          <div className="row g-2 align-items-end">

            {/* Search */}
            <div className="col-12 col-sm-5">
              <label className="form-label small fw-semibold mb-1">Search</label>
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Name, city, fish type…"
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

            {/* Service toggles */}
            <div className="col-12">
              <div className="small fw-semibold mb-1">Service type</div>
              <div className="d-flex gap-2 flex-wrap">
                {(
                  [
                    { label: 'Dine-in',      state: dineIn,    set: setDineIn },
                    { label: 'Carry-out',    state: carryOut,  set: setCarryOut },
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

          </div>
        </div>
      </div>

      {/* ── results ── */}
      {filtered.length === 0 ? (
        <div className="alert alert-info">
          No fish fries match your filters.{' '}
          <button className="btn btn-link p-0 alert-link" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map(item => (
            <div key={item.fishFry.id} className="col-12 col-md-6 col-xl-4">
              <FishFryCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
