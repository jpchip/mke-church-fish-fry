import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import FeedbackModal from './FeedbackModal'

export default function Layout() {
  return (
    <>
      <NavBar />
      <main className="container py-3">
        <Outlet />
      </main>
      <footer className="border-top text-center text-muted small py-3 mt-2 no-print">
        Know a missing location or spot a mistake?{' '}
        <button
          type="button"
          className="btn btn-link btn-sm p-0 text-muted"
          data-bs-toggle="modal"
          data-bs-target="#feedbackModal"
        >
          Submit feedback
        </button>
      </footer>
      <FeedbackModal modalId="feedbackModal" />
    </>
  )
}
