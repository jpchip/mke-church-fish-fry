import { useState } from 'react'

const FORMSPREE_URL = 'https://formspree.io/f/xgolnaav'

type FeedbackType = 'missing-location' | 'incorrect-info' | 'other'

const FEEDBACK_LABELS: Record<FeedbackType, string> = {
  'missing-location': 'Missing location',
  'incorrect-info': 'Incorrect information',
  'other': 'Other',
}

interface Props {
  modalId: string
}

export default function FeedbackModal({ modalId }: Props) {
  const [type, setType] = useState<FeedbackType>('missing-location')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ type: FEEDBACK_LABELS[type], details }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Could not send feedback. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setType('missing-location')
    setDetails('')
    setSubmitted(false)
    setError(null)
  }

  return (
    <div
      className="modal fade"
      id={modalId}
      tabIndex={-1}
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}Label`}>
              Submit Feedback
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={handleClose}
            />
          </div>

          <div className="modal-body">
            {submitted ? (
              <div className="text-center py-3">
                <div className="fs-1 mb-2">✅</div>
                <p className="mb-1 fw-semibold">Thanks for the feedback!</p>
                <p className="text-muted small mb-0">We'll review it and update the site if needed.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} id="feedback-form">
                <p className="text-muted small mb-3">
                  Spot a missing location or an error? Let us know and we'll get it fixed.
                </p>

                <div className="mb-3">
                  <label htmlFor="feedback-type" className="form-label fw-semibold">
                    What kind of feedback?
                  </label>
                  <select
                    id="feedback-type"
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value as FeedbackType)}
                  >
                    {(Object.entries(FEEDBACK_LABELS) as [FeedbackType, string][]).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="feedback-details" className="form-label fw-semibold">
                    Details
                  </label>
                  <textarea
                    id="feedback-details"
                    className="form-control"
                    rows={4}
                    placeholder={
                      type === 'missing-location'
                        ? 'e.g. St. Patrick Church on N. 4th St — fish fry every Friday 4–7 pm'
                        : type === 'incorrect-info'
                        ? "e.g. The hours for St. Mary's are listed as 4–7 pm but they close at 8 pm"
                        : 'Describe your feedback…'
                    }
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="text-danger small mb-0">{error}</p>}
              </form>
            )}
          </div>

          <div className="modal-footer">
            {submitted ? (
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={handleClose}
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="feedback-form"
                  className="btn btn-primary"
                  disabled={!details.trim() || submitting}
                >
                  {submitting ? 'Sending…' : 'Send Feedback'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
