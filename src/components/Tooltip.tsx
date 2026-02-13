import { useState, useRef, useEffect } from 'react'

export function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  const show = () => setVisible(true)
  const hide = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = null
    setVisible(false)
  }

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(show, 400)
  }

  const handleMouseLeave = () => {
    hide()
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setVisible(v => !v)
  }

  // Close on outside click/tap
  useEffect(() => {
    if (!visible) return
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [visible])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (hoverTimer.current) clearTimeout(hoverTimer.current) }
  }, [])

  return (
    <span
      ref={triggerRef}
      className="tooltip-trigger"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      ?
      {visible && (
        <span className="tooltip-bubble">{text}</span>
      )}
    </span>
  )
}
