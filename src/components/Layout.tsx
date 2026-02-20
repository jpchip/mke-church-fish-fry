import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'

export default function Layout() {
  return (
    <>
      <NavBar />
      <main className="container py-3">
        <Outlet />
      </main>
    </>
  )
}
