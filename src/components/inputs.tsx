import { useState } from 'react'

interface InputProps {
  label: string
  tooltip?: string
}

export function CurrencyInput({ label, value, onChange, tooltip }: InputProps & {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="input-group">
      <label>
        {label}
        {tooltip && <span className="tooltip-trigger" title={tooltip}>?</span>}
      </label>
      <div className="input-wrapper currency">
        <span className="prefix">$</span>
        <input
          type="text"
          value={value.toLocaleString()}
          onChange={(e) => onChange(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          onFocus={(e) => e.target.select()}
        />
      </div>
    </div>
  )
}

export function NumberInput({ label, value, onChange, min, max, tooltip }: InputProps & {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="input-group">
      <label>
        {label}
        {tooltip && <span className="tooltip-trigger" title={tooltip}>?</span>}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const val = parseInt(e.target.value)
          if (!isNaN(val)) onChange(val)
        }}
        onBlur={(e) => {
          let val = parseInt(e.target.value) || 0
          if (min !== undefined && val < min) val = min
          if (max !== undefined && val > max) val = max
          onChange(val)
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        onFocus={(e) => e.target.select()}
      />
    </div>
  )
}

export function PercentInput({ label, value, onChange, tooltip, min = 0, max }: InputProps & {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = (raw: string) => {
    let val = parseFloat(raw) / 100 || 0
    if (val < min) val = min
    if (max !== undefined && val > max) val = max
    onChange(val)
    setEditing(false)
  }

  return (
    <div className="input-group">
      <label>
        {label}
        {tooltip && <span className="tooltip-trigger" title={tooltip}>?</span>}
      </label>
      <div className="input-wrapper percent">
        <input
          type="text"
          inputMode="decimal"
          value={editing ? draft : (value * 100).toFixed(1)}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => {
            setEditing(true)
            setDraft((value * 100).toFixed(1))
            requestAnimationFrame(() => e.target.select())
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <span className="suffix">%</span>
      </div>
    </div>
  )
}

export function Card({ title, children, className = '', titleExtra, titleTooltip }: {
  title?: string
  children: React.ReactNode
  className?: string
  titleExtra?: React.ReactNode
  titleTooltip?: string
}) {
  return (
    <div className={`card ${className}`}>
      {title && (
        <h3 className="card-title">
          {title}
          {titleTooltip && <span className="tooltip-trigger" title={titleTooltip}>?</span>}
          {titleExtra}
        </h3>
      )}
      {children}
    </div>
  )
}
