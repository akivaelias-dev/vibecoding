import { useState, useEffect, useRef } from 'react'
import type { ProjectionRow } from '../types.ts'
import { formatCurrency, formatPercent } from '../formatters.ts'

export function NestEggChart({ data, retirementAge }: { data: ProjectionRow[]; retirementAge: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 240 })

  // Responsive resize
  useEffect(() => {
    const container = svgRef.current?.parentElement
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      setDimensions({ width: Math.max(300, width), height: Math.max(200, Math.min(280, width * 0.3)) })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  if (data.length === 0) return null

  const { width, height } = dimensions
  const pad = { top: 24, right: 24, bottom: 52, left: 72 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom

  const values = data.map(r => r.nestEgg)
  const yMax = Math.max(...values, 1)
  const yMin = 0
  const yRange = yMax - yMin || 1

  const yScale = (v: number) => pad.top + chartH - ((Math.max(0, v) - yMin) / yRange) * chartH
  const barGap = 1
  const barWidth = Math.max(1, (chartW / data.length) - barGap)

  // Y-axis ticks — snap to round intervals
  const niceInterval = (range: number, targetTicks: number) => {
    const rough = range / targetTicks
    const mag = Math.pow(10, Math.floor(Math.log10(rough)))
    const norm = rough / mag
    const nice = norm <= 1.5 ? 1 : norm <= 3 ? 2 : norm <= 7 ? 5 : 10
    return nice * mag
  }
  const step = niceInterval(yRange, 5)
  const tickStart = Math.ceil(yMin / step) * step
  const yTicks: number[] = []
  for (let v = tickStart; v <= yMax; v += step) {
    yTicks.push(v)
  }

  // X-axis ticks (every 5 ages)
  const xTicks = data.filter(r => r.yourAge % 5 === 0)

  // Retirement index
  const retirementIdx = data.findIndex(r => r.yourAge === retirementAge + 1)

  // Bar position helper
  const barX = (i: number) => pad.left + i * (barWidth + barGap)

  // Hover from mouse position
  const resolveHoverIdx = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mouseX = clientX - rect.left - pad.left
    const idx = Math.floor(mouseX / (barWidth + barGap))
    if (idx >= 0 && idx < data.length) setHover(idx)
  }

  const hoverRow = hover !== null ? data[hover] : null

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2>Nest Egg Over Time</h2>
      </div>
      <div className="chart-svg-wrapper">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={(e) => resolveHoverIdx(e.clientX)}
          onMouseLeave={() => setHover(null)}
          onTouchMove={(e) => { if (e.touches[0]) resolveHoverIdx(e.touches[0].clientX) }}
          onTouchEnd={() => setHover(null)}
        >
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={`y-${i}`}>
              <line
                x1={pad.left} x2={width - pad.right}
                y1={yScale(tick)} y2={yScale(tick)}
                stroke="#E8E3DC" strokeWidth="1"
              />
              <text
                x={pad.left - 8} y={yScale(tick) + 4}
                textAnchor="end" fill="#9C9690"
                fontSize="10" fontFamily="Jost, system-ui, sans-serif"
              >
                {tick >= 1_000_000 ? `$${(tick / 1_000_000).toFixed(1)}M`
                  : tick >= 1_000 ? `$${(tick / 1_000).toFixed(0)}K`
                  : `$${tick.toFixed(0)}`}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xTicks.map((row) => {
            const idx = data.indexOf(row)
            return (
              <g key={`x-${row.yourAge}`}>
                <text
                  x={barX(idx) + barWidth / 2}
                  y={height - pad.bottom + 16}
                  textAnchor="middle" fill="#9C9690"
                  fontSize="10" fontFamily="Jost, system-ui, sans-serif"
                >
                  {row.yourAge}
                </text>
                <text
                  x={barX(idx) + barWidth / 2}
                  y={height - pad.bottom + 28}
                  textAnchor="middle" fill="#BCB7B0"
                  fontSize="8" fontFamily="Jost, system-ui, sans-serif"
                >
                  {row.calendarYear}
                </text>
              </g>
            )
          })}

          {/* Retirement marker */}
          {retirementIdx >= 0 && (
            <g>
              <line
                x1={barX(retirementIdx)} x2={barX(retirementIdx)}
                y1={pad.top} y2={pad.top + chartH}
                stroke="#7B9E87" strokeWidth="1" strokeDasharray="4 3" opacity="0.6"
              />
              <text
                x={barX(retirementIdx)} y={pad.top - 6}
                textAnchor="middle" fill="#5A7A64"
                fontSize="9" fontFamily="Jost, system-ui, sans-serif"
                fontWeight="600"
              >
                Retire
              </text>
            </g>
          )}

          {/* Bars */}
          {data.map((row, i) => {
            const barH = Math.max(0, ((Math.max(0, row.nestEgg)) / yRange) * chartH)
            const isRetired = row.yourAge > retirementAge
            const isDepleted = row.nestEgg <= 0
            const isHovered = hover === i

            let fill = isRetired ? '#7B9E87' : '#2D2A26'
            if (isDepleted) fill = '#C45D4A'
            const opacity = isHovered ? 1 : 0.75

            return (
              <rect
                key={i}
                x={barX(i)}
                y={yScale(Math.max(0, row.nestEgg))}
                width={barWidth}
                height={barH}
                rx={Math.min(2, barWidth / 2)}
                fill={fill}
                opacity={opacity}
              />
            )
          })}

          {/* Hover highlight line */}
          {hover !== null && (
            <line
              x1={barX(hover) + barWidth / 2}
              x2={barX(hover) + barWidth / 2}
              y1={pad.top}
              y2={yScale(Math.max(0, data[hover].nestEgg))}
              stroke="#2D2A26" strokeWidth="1" opacity="0.15" strokeDasharray="2 2"
            />
          )}
        </svg>

        {/* Tooltip */}
        {hoverRow && hover !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: Math.min(
                barX(hover) + barWidth + 8,
                width - 170
              ),
              top: pad.top,
            }}
          >
            <div className="chart-tooltip-age">Age {hoverRow.yourAge}</div>
            <div className="chart-tooltip-row base">
              <span>Nest Egg</span>
              <span className="chart-tooltip-val">{formatCurrency(hoverRow.nestEgg)}</span>
            </div>
            {hoverRow.preTaxRetirementIncome > 0 && (
              <div className="chart-tooltip-row base">
                <span>Pre-tax Income</span>
                <span className="chart-tooltip-val">{formatCurrency(hoverRow.preTaxRetirementIncome)}</span>
              </div>
            )}
            {hoverRow.drawdownRate > 0 && (
              <div className="chart-tooltip-row base">
                <span>Drawdown</span>
                <span className="chart-tooltip-val">{formatPercent(hoverRow.drawdownRate)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
