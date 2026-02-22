import { useEffect, useRef, useState } from 'react'
import type { LocationWithFishFry } from '../lib/types'

// Bootstrap is loaded as a global bundle in main.tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bsModal = () => (window as any).bootstrap?.Modal

interface Props {
  dateLabel: string
  available: LocationWithFishFry[]
  favorites: Set<number>
  currentFishFryId: number | undefined
  onSelect: (fishFryId: number) => void
  onClose: () => void
}

export default function AddFishFryModal({ dateLabel, available, favorites, currentFishFryId, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [favOnly, setFavOnly] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('hidden.bs.modal', onClose)
    return () => el.removeEventListener('hidden.bs.modal', onClose)
  }, [onClose])

  // Reset state when the modal opens for a new date
  useEffect(() => { setExpandedId(null); setFavOnly(false) }, [dateLabel])

  const favCount = available.filter(item => favorites.has(item.id)).length
  const visible  = favOnly ? available.filter(item => favorites.has(item.id)) : available

  function handleSelect(id: number) {
    onSelect(id)
    const modal = bsModal()?.getInstance(ref.current!)
    modal?.hide()
  }

  return (
    <div className="modal fade" id="addFishFryModal" tabIndex={-1} aria-labelledby="addFishFryModalLabel" aria-hidden="true" ref={ref}>
      <div className="modal-dialog modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header flex-column align-items-start gap-2 pb-2">
            <div className="d-flex w-100 align-items-center">
              <h5 className="modal-title mb-0" id="addFishFryModalLabel">
                Choose a fish fry — {dateLabel}
              </h5>
              <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            {favCount > 0 && (
              <div className="btn-group btn-group-sm w-100" role="group" aria-label="Filter fish fries">
                <button
                  type="button"
                  className={`btn ${!favOnly ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFavOnly(false)}
                >
                  All ({available.length})
                </button>
                <button
                  type="button"
                  className={`btn ${favOnly ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFavOnly(true)}
                >
                  🐟 Favorites ({favCount})
                </button>
              </div>
            )}
          </div>
          <div className="modal-body p-0">
            {visible.length === 0 ? (
              <p className="text-muted p-3 mb-0">No fish fries available for this date.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {visible.map(item => {
                  const ff = item.fishFry
                  const isSelected = ff.id === currentFishFryId
                  const isExpanded = expandedId === ff.id

                  return (
                    <li
                      key={ff.id}
                      className={`list-group-item list-group-item-action${isSelected ? ' list-group-item-primary' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelect(ff.id)}
                    >
                      {/* Main row */}
                      <div className="d-flex align-items-start gap-2">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-1 flex-wrap">
                            <span className="fw-semibold">{item.name}</span>
                            {isSelected && (
                              <span className="badge bg-primary ms-1" style={{ fontSize: '0.65rem' }}>Selected</span>
                            )}
                          </div>
                          <div className="text-muted small mt-1" style={{ lineHeight: 1.6 }}>
                            {item.city && <span>{item.city}, WI</span>}
                            {item.city && (ff.hours_open || ff.hours_close) && <span className="mx-1">·</span>}
                            {(ff.hours_open || ff.hours_close) && (
                              <span>{ff.hours_open}–{ff.hours_close}</span>
                            )}
                            {ff.price_adult != null && (
                              <span className="ms-1">· <strong className="text-body">${ff.price_adult}</strong> adult</span>
                            )}
                          </div>
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {!!ff.dine_in       && <span className="badge bg-primary"           style={{ fontSize: '0.65rem' }}>Dine-in</span>}
                            {!!ff.carry_out     && <span className="badge bg-success"           style={{ fontSize: '0.65rem' }}>Carry-out</span>}
                            {!!ff.drive_through && <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>Drive-through</span>}
                          </div>
                        </div>

                        {/* Expand toggle — stops propagation so it doesn't select */}
                        <button
                          className="btn btn-sm btn-link p-0 text-muted flex-shrink-0"
                          style={{ fontSize: '0.75rem', lineHeight: 1 }}
                          title={isExpanded ? 'Show less' : 'Show more'}
                          onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : ff.id) }}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div
                          className="mt-2 pt-2 small"
                          style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          {ff.fish_types && (
                            <div><span className="text-muted">Fish:</span> {ff.fish_types}</div>
                          )}
                          {ff.sides && (
                            <div><span className="text-muted">Sides:</span> {ff.sides}</div>
                          )}
                          {(ff.price_child != null || ff.price_senior != null || ff.price_family != null) && (
                            <div className="d-flex gap-3 flex-wrap">
                              {ff.price_child  != null && <span><span className="text-muted">Child:</span> ${ff.price_child}</span>}
                              {ff.price_senior != null && <span><span className="text-muted">Senior:</span> ${ff.price_senior}</span>}
                              {ff.price_family != null && <span><span className="text-muted">Family:</span> ${ff.price_family}</span>}
                            </div>
                          )}
                          {ff.price_notes && (
                            <div className="text-muted fst-italic">{ff.price_notes}</div>
                          )}
                          {ff.description && (
                            <div className="text-muted mt-1">{ff.description}</div>
                          )}
                          {item.address && (
                            <div className="text-muted">{item.address}</div>
                          )}
                          {item.website && (
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="d-block"
                              onClick={e => e.stopPropagation()}
                            >
                              Website ↗
                            </a>
                          )}
                          <button
                            className={`btn btn-sm mt-2 w-100 ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={e => { e.stopPropagation(); handleSelect(ff.id) }}
                          >
                            {isSelected ? '✓ Selected' : 'Pick this fish fry'}
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
