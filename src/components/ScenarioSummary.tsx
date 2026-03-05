import type { ProjectionRow } from '../types.ts'
import { formatCurrency, formatPercent } from '../formatters.ts'
import type { ScenarioData } from '../hooks/useAppState.ts'

interface ScenarioCardProps {
  label: string
  variant: 'pessimistic' | 'base' | 'optimistic'
  badge?: string
  data: ScenarioData
}

function ScenarioCard({ label, variant, badge, data }: ScenarioCardProps) {
  const { atRetirement, isDepleted, lastRow, investmentReturn, cola } = data
  return (
    <div className={`scenario-card ${variant}`}>
      {badge && <div className="scenario-badge">{badge}</div>}
      <div className="scenario-label">{label}</div>
      <div className="scenario-assumptions">
        {formatPercent(investmentReturn)} return · {formatPercent(cola)} inflation
      </div>
      <div className="scenario-nest-egg">{formatCurrency(atRetirement)}</div>
      <div className="scenario-sub">at retirement</div>
      {isDepleted && lastRow && (
        <div className="scenario-depleted">Depleted at age {(lastRow as ProjectionRow).yourAge}</div>
      )}
      {!isDepleted && lastRow && (
        <div className="scenario-ok">Funds last to {(lastRow as ProjectionRow).yourAge}+ years old</div>
      )}
    </div>
  )
}

interface ScenarioSummaryProps {
  pessimistic: ScenarioData
  base: ScenarioData
  optimistic: ScenarioData
}

export function ScenarioSummary({ pessimistic, base, optimistic }: ScenarioSummaryProps) {
  return (
    <div className="scenarios animate-fade-in-up delay-2">
      <ScenarioCard label="Pessimistic" variant="pessimistic" data={pessimistic} />
      <ScenarioCard label="Base Case" variant="base" badge="Your Plan" data={base} />
      <ScenarioCard label="Optimistic" variant="optimistic" data={optimistic} />
    </div>
  )
}
