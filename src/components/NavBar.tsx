import { NavLink } from 'react-router-dom'
import { useDarkMode } from '../lib/useDarkMode'

export default function NavBar() {
  const { isDark, toggle } = useDarkMode()

  return (
    <nav className="navbar navbar-expand-sm navbar-dark bg-primary sticky-top">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/">
          <span style={{ fontSize: '1.5em' }}>🐟</span> Fish Frynder
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <div className="d-flex flex-row align-items-start align-items-sm-center ms-auto">
            <ul className="navbar-nav align-items-sm-center">
              <li className="nav-item">
                <NavLink className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} to="/" end>
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} to="/browse">
                  Browse
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} to="/guide">
                  Guide
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} to="/map">
                  Map
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} to="/plan">
                  Plan
                </NavLink>
              </li>
            </ul>
            <div className="ms-auto ms-sm-3 mt-1 mt-sm-0">
              <button
                className="btn btn-sm btn-outline-light"
                onClick={toggle}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
