import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="text-center py-4">
      <h1 className="display-5 fw-bold mb-2">MKE Church Fish Fries</h1>
      <p className="lead text-muted mb-4">
        Find a Lenten fish fry near you in the Milwaukee area — 2026 edition.
      </p>

      <div className="row g-3 justify-content-center">
        <div className="col-12 col-sm-6 col-md-4">
          <Link to="/browse" className="card text-decoration-none text-body h-100">
            <div className="card-body">
              <div className="fs-1">📋</div>
              <h5 className="card-title mt-2">Browse</h5>
              <p className="card-text text-muted">View all fish fry locations with details on fish, sides, prices, and hours.</p>
            </div>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-md-4">
          <Link to="/map" className="card text-decoration-none text-body h-100">
            <div className="card-body">
              <div className="fs-1">🗺️</div>
              <h5 className="card-title mt-2">Map</h5>
              <p className="card-text text-muted">See all locations on a map and find the fish fry closest to you.</p>
            </div>
          </Link>
        </div>
      </div>

      <p className="text-muted mt-5 small">
        Lenten Fridays 2026: Feb 20 &amp; 27, Mar 6, 13, 20, 27, Apr 3
      </p>
      <p className="text-muted small">
        Data sourced from{' '}
        <a
          href="https://www.jsonline.com/story/entertainment/dining/2026/02/18/church-and-nonprofit-fish-fries-in-milwaukee-area-for-lent-2026/88394289007/"
          target="_blank"
          rel="noreferrer"
          className="text-muted"
        >
          Milwaukee Journal Sentinel
        </a>
      </p>
    </div>
  )
}
