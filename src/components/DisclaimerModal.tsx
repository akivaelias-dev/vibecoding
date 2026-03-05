import { useState } from 'react'

const DISCLAIMER_STORAGE_KEY = 'disclaimer-acknowledged'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

function shouldShowDisclaimer(): boolean {
  const lastAck = localStorage.getItem(DISCLAIMER_STORAGE_KEY)
  if (!lastAck) return true
  return Date.now() - parseInt(lastAck) > ONE_DAY_MS
}

interface DisclaimerModalProps {
  /** Called when the user acknowledges the disclaimer */
  onAcknowledge: () => void
}

export function DisclaimerModal({ onAcknowledge }: DisclaimerModalProps) {
  const [visible] = useState(shouldShowDisclaimer)

  const handleAcknowledge = () => {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, String(Date.now()))
    onAcknowledge()
  }

  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={handleAcknowledge}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <p className="modal-text">
          This tool provides general estimates only and is not financial advice. It was built as a
          vibecoding exercise to learn how to use Claude. Consult a qualified financial advisor for
          personalized guidance.
        </p>
        <p className="modal-text">
          If you choose to use the app, know that all user data is local to the device and not transmitted.
        </p>
        <button className="modal-btn" onClick={handleAcknowledge}>
          I Understand
        </button>
      </div>
    </div>
  )
}
