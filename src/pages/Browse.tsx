export default function Browse() {
  return (
    <div>
      <h2 className="mb-3">Browse Fish Fries</h2>
      <p className="text-muted">
        All Milwaukee-area church and nonprofit fish fry locations will appear here.
      </p>
      {/* TODO: load from fish_fry.db via API and render location cards */}
      <div className="alert alert-info">Coming soon — fish fry listings.</div>
    </div>
  )
}
