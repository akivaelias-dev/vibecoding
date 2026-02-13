import { useState, useMemo, useEffect } from 'react'
import type { AppState, ProjectionRow } from './types.ts'
import { generateProjections } from './calculations.ts'
import { formatCurrency, formatCurrencyFull, formatPercent } from './formatters.ts'
import { exportCsv, exportExcel } from './exports.ts'
import { CurrencyInput, NumberInput, PercentInput, Card } from './components/inputs.tsx'
import { NestEggChart } from './components/NestEggChart.tsx'
import { DisclaimerPage } from './components/DisclaimerPage.tsx'
import styles from './styles.ts'
import { STORAGE_KEY, loadSaved } from './constants.ts'

const saved = loadSaved()

function App() {
  // Inject styles on mount
  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = styles
    document.head.appendChild(styleEl)
    return () => { document.head.removeChild(styleEl) }
  }, [])

  // ===== Assets State =====
  const [nonRetirementAssets, setNonRetirementAssets] = useState(saved.nonRetirementAssets)
  const [retirementAssets, setRetirementAssets] = useState(saved.retirementAssets)
  const [realEstateAssets, setRealEstateAssets] = useState(saved.realEstateAssets)

  // ===== Your Info State =====
  const [yourAge, setYourAge] = useState(saved.yourAge)
  const [yourRetirementAge, setYourRetirementAge] = useState(saved.yourRetirementAge)
  const [yourBrokerageContribution, setYourBrokerageContribution] = useState(saved.yourBrokerageContribution)
  const [yourRetirementContribution, setYourRetirementContribution] = useState(saved.yourRetirementContribution)
  const [yourSocialSecurity, setYourSocialSecurity] = useState(saved.yourSocialSecurity)
  const [yourSSStartAge, setYourSSStartAge] = useState(saved.yourSSStartAge)

  // ===== Partner State =====
  const [showPartner, setShowPartner] = useState(saved.showPartner)
  const [partnerAge, setPartnerAge] = useState(saved.partnerAge)
  const [partnerRetirementAge, setPartnerRetirementAge] = useState(saved.partnerRetirementAge)
  const [partnerBrokerageContribution, setPartnerBrokerageContribution] = useState(saved.partnerBrokerageContribution)
  const [partnerRetirementContribution, setPartnerRetirementContribution] = useState(saved.partnerRetirementContribution)
  const [partnerSocialSecurity, setPartnerSocialSecurity] = useState(saved.partnerSocialSecurity)
  const [partnerSSStartAge, setPartnerSSStartAge] = useState(saved.partnerSSStartAge)

  // ===== Retirement Goals State =====
  const [monthlyRetirementCash, setMonthlyRetirementCash] = useState(saved.monthlyRetirementCash)
  const [monthlyPartialRetirementCash, setMonthlyPartialRetirementCash] = useState(saved.monthlyPartialRetirementCash)

  // ===== Assumptions State =====
  const [cola, setCola] = useState(saved.cola)
  const [investmentReturn, setInvestmentReturn] = useState(saved.investmentReturn)
  const [brokerageTaxRate, setBrokerageTaxRate] = useState(saved.brokerageTaxRate)
  const [federalTaxRate, setFederalTaxRate] = useState(saved.federalTaxRate)
  const [stateTaxRate, setStateTaxRate] = useState(saved.stateTaxRate)

  // ===== Persist to localStorage =====
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nonRetirementAssets, retirementAssets, realEstateAssets,
      yourAge, yourRetirementAge, yourBrokerageContribution, yourRetirementContribution,
      yourSocialSecurity, yourSSStartAge,
      showPartner, partnerAge, partnerRetirementAge, partnerBrokerageContribution,
      partnerRetirementContribution, partnerSocialSecurity, partnerSSStartAge,
      monthlyRetirementCash, monthlyPartialRetirementCash,
      cola, investmentReturn, brokerageTaxRate, federalTaxRate, stateTaxRate,
    }))
  }, [
    nonRetirementAssets, retirementAssets, realEstateAssets,
    yourAge, yourRetirementAge, yourBrokerageContribution, yourRetirementContribution,
    yourSocialSecurity, yourSSStartAge,
    showPartner, partnerAge, partnerRetirementAge, partnerBrokerageContribution,
    partnerRetirementContribution, partnerSocialSecurity, partnerSSStartAge,
    monthlyRetirementCash, monthlyPartialRetirementCash,
    cola, investmentReturn, brokerageTaxRate, federalTaxRate, stateTaxRate,
  ])

  // ===== UI State =====
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [showDisclaimerPage, setShowDisclaimerPage] = useState(false)

  // ===== Disclaimer Modal =====
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    const lastAck = localStorage.getItem('disclaimer-acknowledged')
    if (!lastAck) return true
    return Date.now() - parseInt(lastAck) > 24 * 60 * 60 * 1000
  })

  const acknowledgeDisclaimer = () => {
    localStorage.setItem('disclaimer-acknowledged', String(Date.now()))
    setShowDisclaimer(false)
  }

  // ===== Derived Values =====
  const totalAssets = nonRetirementAssets + retirementAssets + realEstateAssets

  const state: AppState = {
    nonRetirementAssets, retirementAssets, realEstateAssets,
    yourAge, yourRetirementAge, yourBrokerageContribution, yourRetirementContribution,
    yourSocialSecurity, yourSSStartAge,
    partnerAge: showPartner ? partnerAge : 0,
    partnerRetirementAge: showPartner ? partnerRetirementAge : 0,
    partnerBrokerageContribution: showPartner ? partnerBrokerageContribution : 0,
    partnerRetirementContribution: showPartner ? partnerRetirementContribution : 0,
    partnerSocialSecurity: showPartner ? partnerSocialSecurity : 0,
    partnerSSStartAge: showPartner ? partnerSSStartAge : 0,
    monthlyRetirementCash, monthlyPartialRetirementCash,
    cola, investmentReturn, brokerageTaxRate, federalTaxRate, stateTaxRate,
  }

  const projections = useMemo(() => generateProjections(state), [
    nonRetirementAssets, retirementAssets, realEstateAssets,
    yourAge, yourRetirementAge, yourBrokerageContribution, yourRetirementContribution,
    yourSocialSecurity, yourSSStartAge,
    showPartner, partnerAge, partnerRetirementAge, partnerBrokerageContribution,
    partnerRetirementContribution, partnerSocialSecurity, partnerSSStartAge,
    monthlyRetirementCash, monthlyPartialRetirementCash,
    cola, investmentReturn, brokerageTaxRate, federalTaxRate, stateTaxRate,
  ])

  // ===== Scenario Projections =====
  const scenarioDeps = [
    nonRetirementAssets, retirementAssets, realEstateAssets,
    yourAge, yourRetirementAge, yourBrokerageContribution, yourRetirementContribution,
    yourSocialSecurity, yourSSStartAge,
    showPartner, partnerAge, partnerRetirementAge, partnerBrokerageContribution,
    partnerRetirementContribution, partnerSocialSecurity, partnerSSStartAge,
    monthlyRetirementCash, monthlyPartialRetirementCash,
    cola, investmentReturn, brokerageTaxRate, federalTaxRate, stateTaxRate,
  ]

  const pessimisticProjections = useMemo(() => generateProjections({
    ...state,
    investmentReturn: Math.max(0, investmentReturn - 0.03),
    cola: cola + 0.012,
  }), scenarioDeps)

  const optimisticProjections = useMemo(() => generateProjections({
    ...state,
    investmentReturn: investmentReturn + 0.03,
    cola: Math.max(0, cola - 0.008),
  }), scenarioDeps)

  // ===== Milestone Calculations =====
  const findRetirementRow = (rows: ProjectionRow[]) =>
    rows.find(r => r.yourAge === yourRetirementAge + 1 || (showPartner && r.partnerAge === partnerRetirementAge + 1))

  const firstRetirementYear = findRetirementRow(projections)
  const atRetirementNestEgg = firstRetirementYear?.nestEgg || projections[0]?.nestEgg || 0

  const lastRow = projections[projections.length - 1]
  const isDepleted = lastRow && lastRow.nestEgg <= 0

  // Scenario milestones
  const pessRetRow = findRetirementRow(pessimisticProjections)
  const pessAtRetirement = pessRetRow?.nestEgg || pessimisticProjections[0]?.nestEgg || 0
  const pessLast = pessimisticProjections[pessimisticProjections.length - 1]
  const pessDepleted = pessLast && pessLast.nestEgg <= 0

  const optRetRow = findRetirementRow(optimisticProjections)
  const optAtRetirement = optRetRow?.nestEgg || optimisticProjections[0]?.nestEgg || 0
  const optLast = optimisticProjections[optimisticProjections.length - 1]
  const optDepleted = optLast && optLast.nestEgg <= 0

  // ===== Render =====
  if (showDisclaimerPage) {
    return <DisclaimerPage onBack={() => { setShowDisclaimerPage(false); window.scrollTo(0, 0) }} />
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header animate-fade-in-up">
        <h1>How Am I Looking?</h1>
        <p>A quick check on your retirement trajectory</p>
      </header>



      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Assets Card */}
          <Card
            title="Assets"
            className="animate-fade-in-up delay-2"
            titleTooltip="Any debt that you currently service we assume is part of your existing lifestyle and cash flow management"
          >
            <CurrencyInput
              label="Non-Retirement Assets"
              value={nonRetirementAssets}
              onChange={setNonRetirementAssets}
              tooltip="Savings/investment accounts; exclude unvested shares, 529s, gift accounts"
            />
            <CurrencyInput
              label="Retirement Accounts"
              value={retirementAssets}
              onChange={setRetirementAssets}
              tooltip="IRAs, 401(k)s, etc."
            />
            <CurrencyInput
              label="Real Estate"
              value={realEstateAssets}
              onChange={setRealEstateAssets}
              tooltip="Exclude the home you live in; include value of other real estate assets minus the mortgage loans"
            />
            <div className="total-display">
              <span className="total-label">Total Assets</span>
              <span className="total-value">{formatCurrencyFull(totalAssets)}</span>
            </div>
          </Card>

          {/* You Card */}
          <Card title="You" className="animate-fade-in-up delay-3">
            <NumberInput label="Current Age" value={yourAge} onChange={(v) => { setYourAge(v); if (yourRetirementAge <= v) setYourRetirementAge(v + 1) }} min={0} max={100} />
            <NumberInput label="Retirement Age" value={yourRetirementAge} onChange={setYourRetirementAge} min={yourAge + 1} max={100} />
            <CurrencyInput
              label="Annual Brokerage Contribution"
              value={yourBrokerageContribution}
              onChange={setYourBrokerageContribution}
              tooltip="Annual contribution to brokerage accounts while working (today's dollars)"
            />
            <CurrencyInput
              label="Annual Retirement Contribution"
              value={yourRetirementContribution}
              onChange={setYourRetirementContribution}
              tooltip="Annual contribution to retirement accounts while working (today's dollars)"
            />
            <CurrencyInput
              label="Monthly Social Security Benefit"
              value={yourSocialSecurity}
              onChange={setYourSocialSecurity}
              tooltip="Expected monthly pre-tax benefit in today's dollars (see ssa.gov)"
            />
            <NumberInput
              label="Collect Social Security Benefit from Age"
              value={yourSSStartAge}
              onChange={setYourSSStartAge}
              min={62}
              max={70}
            />
          </Card>

          {/* Partner Card */}
          {showPartner ? (
            <Card
              title="Partner"
              className="animate-fade-in-up delay-4"
              titleExtra={
                <button className="remove-partner-btn" onClick={() => setShowPartner(false)}>
                  Remove
                </button>
              }
            >
              <NumberInput label="Current Age" value={partnerAge} onChange={(v) => { setPartnerAge(v); if (partnerRetirementAge <= v) setPartnerRetirementAge(v + 1) }} min={0} max={100} />
              <NumberInput label="Retirement Age" value={partnerRetirementAge} onChange={setPartnerRetirementAge} min={partnerAge + 1} max={100} />
              <CurrencyInput label="Annual Brokerage Contribution" value={partnerBrokerageContribution} onChange={setPartnerBrokerageContribution} />
              <CurrencyInput label="Annual Retirement Contribution" value={partnerRetirementContribution} onChange={setPartnerRetirementContribution} />
              <CurrencyInput label="Monthly Social Security Benefit" value={partnerSocialSecurity} onChange={setPartnerSocialSecurity} />
              <NumberInput label="Collect Social Security Benefit from Age" value={partnerSSStartAge} onChange={setPartnerSSStartAge} min={62} max={70} />
            </Card>
          ) : (
            <button className="add-partner-btn animate-fade-in-up delay-4" onClick={() => setShowPartner(true)}>
              + Add Partner / Spouse
            </button>
          )}

          {/* Retirement Goal Card */}
          <Card title="Retirement Goal" className="animate-fade-in-up delay-5" titleTooltip="The model does not take into consideration any inheritance or pension that you may expect; adjust the desired monthly cash to account for such cash flows">
            <CurrencyInput
              label="Desired Monthly Cash when Retired"
              value={monthlyRetirementCash}
              onChange={setMonthlyRetirementCash}
              tooltip="Desired after-tax monthly retirement income in today's dollars (assumes you and your partner are not working)"
            />
            {showPartner && (
              <CurrencyInput
                label="Monthly Cash Supplement (one retired)"
                value={monthlyPartialRetirementCash}
                onChange={setMonthlyPartialRetirementCash}
                tooltip="After-tax amount needed from nest egg in today's dollars, to cover for one less income when the first person retires"
              />
            )}
          </Card>

          {/* Assumptions Card */}
          <Card title="Assumptions" className="animate-fade-in-up delay-5" titleExtra={
            <button className="reset-link" onClick={() => {
              setCola(0.028); setInvestmentReturn(0.08); setBrokerageTaxRate(0.15)
              setFederalTaxRate(0.37); setStateTaxRate(0.133)
            }}>Reset</button>
          }>
            <PercentInput label="COLA / Inflation" value={cola} onChange={setCola} tooltip="Cost-of-Living Adjustment" />
            <PercentInput label="Investment Return" value={investmentReturn} onChange={setInvestmentReturn} />
            <PercentInput label="Brokerage Tax Rate" value={brokerageTaxRate} onChange={setBrokerageTaxRate} tooltip="Tax rate for withdrawals from brokerage accounts" max={1} />
            <PercentInput label="Federal Tax Rate" value={federalTaxRate} onChange={setFederalTaxRate} tooltip="Enter an appropriate tax rate based on your retirement income tax bracket" max={1} />
            <PercentInput label="State Tax Rate" value={stateTaxRate} onChange={setStateTaxRate} tooltip="The tax rate based on your retirement income tax bracket for the state in which you plan to retire in" max={1} />
          </Card>
        </aside>

        {/* Chart + Projection Table */}
        <main>
          {/* Scenario Comparison */}
          <div className="scenarios animate-fade-in-up delay-2">
            <div className="scenario-card pessimistic">
              <div className="scenario-label">Pessimistic</div>
              <div className="scenario-assumptions">
                {formatPercent(Math.max(0, investmentReturn - 0.03))} return · {formatPercent(cola + 0.012)} inflation
              </div>
              <div className="scenario-nest-egg">{formatCurrency(pessAtRetirement)}</div>
              <div className="scenario-sub">at retirement</div>
              {pessDepleted && (
                <div className="scenario-depleted">Depleted at age {pessLast.yourAge}</div>
              )}
              {!pessDepleted && pessLast && (
                <div className="scenario-ok">Funds last to {pessLast.yourAge}+</div>
              )}
            </div>

            <div className="scenario-card base">
              <div className="scenario-badge">Your Plan</div>
              <div className="scenario-label">Base Case</div>
              <div className="scenario-assumptions">
                {formatPercent(investmentReturn)} return · {formatPercent(cola)} inflation
              </div>
              <div className="scenario-nest-egg">{formatCurrency(atRetirementNestEgg)}</div>
              <div className="scenario-sub">at retirement</div>
              {isDepleted && (
                <div className="scenario-depleted">Depleted at age {lastRow.yourAge}</div>
              )}
              {!isDepleted && lastRow && (
                <div className="scenario-ok">Funds last to {lastRow.yourAge}+</div>
              )}
            </div>

            <div className="scenario-card optimistic">
              <div className="scenario-label">Optimistic</div>
              <div className="scenario-assumptions">
                {formatPercent(investmentReturn + 0.03)} return · {formatPercent(Math.max(0, cola - 0.008))} inflation
              </div>
              <div className="scenario-nest-egg">{formatCurrency(optAtRetirement)}</div>
              <div className="scenario-sub">at retirement</div>
              {optDepleted && (
                <div className="scenario-depleted">Depleted at age {optLast.yourAge}</div>
              )}
              {!optDepleted && optLast && (
                <div className="scenario-ok">Funds last to {optLast.yourAge}+</div>
              )}
            </div>
          </div>

          <NestEggChart data={projections} retirementAge={yourRetirementAge} />
          <div className="projection-container animate-fade-in-up delay-3">
            <div className="projection-header">
              <h2>Year-by-Year Projection</h2>
              <button className="toggle-columns-btn" onClick={() => setShowAllColumns(!showAllColumns)}>
                {showAllColumns ? 'Hide Details' : 'Show All Columns'}
              </button>
            </div>

            <div className="table-wrapper">
              <table key={showAllColumns ? 'all' : 'summary'}>
                <thead>
                  <tr>
                    <th></th>
                    <th className="col-narrow">Calendar Year</th>
                    <th className="col-narrow">My Age</th>
                    {showAllColumns && showPartner && <th>Partner Age</th>}
                    {showAllColumns && <th>My Savings while Working</th>}
                    {showAllColumns && showPartner && <th>Partner's Savings while Working</th>}
                    {showAllColumns && <th>My Retirement Account Contribution</th>}
                    {showAllColumns && showPartner && <th>Partner's Retirement Account Contribution</th>}
                    {showAllColumns && <th>Desired Monthly Cash when Retired (in today's dollars)</th>}
                    {showAllColumns && <th>Pre-tax Annual Social Security Benefit</th>}
                    {showAllColumns && <th>Post-tax Annual Retirement Income Required</th>}
                    {showAllColumns && <th>Cash Available from Non-retirement Assets</th>}
                    {showAllColumns && <th>Cash Available from Retirement Accounts</th>}
                    {showAllColumns && <th>Amount Deducted from Non-retirement Assets</th>}
                    {showAllColumns && <th>Amount Deducted from Retirement Accounts</th>}
                    <th className="col-currency">Pre-tax Retirement Income</th>
                    <th className="col-currency">Non-retirement Assets</th>
                    <th className="col-currency">Retirement Accounts</th>
                    <th className="col-currency">Nest Egg</th>
                    <th className="highlight col-narrow">Drawdown</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((row) => {
                    const isRetirement = row.yourAge === yourRetirementAge + 1 ||
                      (showPartner && row.partnerAge === partnerRetirementAge + 1)
                    const isSS = row.yourAge === yourSSStartAge ||
                      (showPartner && row.partnerAge === partnerSSStartAge)
                    const isRowDepleted = row.nestEgg <= 0 && row.desiredMonthlyCash > 0

                    return (
                      <tr
                        key={row.yearNum}
                        className={`
                          ${isRetirement ? 'milestone-retirement' : ''}
                          ${isSS && !isRetirement ? 'milestone-ss' : ''}
                          ${isRowDepleted ? 'depleted' : ''}
                        `}
                      >
                        <td>{row.yearNum}</td>
                        <td>{row.calendarYear}</td>
                        <td className="age">{row.yourAge}</td>
                        {showAllColumns && showPartner && <td className="age">{row.partnerAge}</td>}
                        {showAllColumns && <td>{formatCurrency(row.yourSavings)}</td>}
                        {showAllColumns && showPartner && <td>{formatCurrency(row.partnerSavings)}</td>}
                        {showAllColumns && <td>{formatCurrency(row.yourRetirementContrib)}</td>}
                        {showAllColumns && showPartner && <td>{formatCurrency(row.partnerRetirementContrib)}</td>}
                        {showAllColumns && <td>{formatCurrencyFull(row.desiredMonthlyCash)}</td>}
                        {showAllColumns && <td>{formatCurrency(row.preTaxSocialSecurity)}</td>}
                        {showAllColumns && <td>{formatCurrency(row.postTaxIncomeRequired)}</td>}
                        {showAllColumns && <td>{formatCurrency(row.cashAvailableNonRet)}</td>}
                        {showAllColumns && <td>{formatCurrency(row.cashAvailableRet)}</td>}
                        {showAllColumns && <td>{formatCurrency(row.amountDeductedNonRet)}</td>}
                        {showAllColumns && <td>{formatCurrency(row.amountDeductedRet)}</td>}
                        <td>{formatCurrency(row.preTaxRetirementIncome)}</td>
                        <td>{formatCurrency(row.nonRetirementAssets)}</td>
                        <td>{formatCurrency(row.retirementAccounts)}</td>
                        <td className={`nest-egg ${isRowDepleted ? 'warning' : ''}`}>
                          {formatCurrency(row.nestEgg)}
                        </td>
                        <td className="highlight">
                          {row.drawdownRate > 0 ? formatPercent(row.drawdownRate) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-legend">
              <div className="legend-item">
                <div className="legend-dot retirement"></div>
                <span>Retirement Year</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot ss"></div>
                <span>Social Security Starts</span>
              </div>
              {isDepleted && (
                <div className="legend-item">
                  <div className="legend-dot depleted"></div>
                  <span>Funds Depleted</span>
                </div>
              )}
              <div className="export-buttons">
                <button className="export-csv-btn" onClick={() => exportCsv(projections, showPartner)}>
                  Download .csv
                </button>
                <button className="export-csv-btn" onClick={() => exportExcel(state, projections.length)}>
                  Download Excel
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer">
        This tool provides general estimates only and is not financial advice.<br />
        Consult a qualified financial advisor for personalized guidance.<br />
        <button className="disclaimer-link" onClick={() => { setShowDisclaimerPage(true); window.scrollTo(0, 0) }}>
          Disclaimer
        </button>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="modal-overlay" onClick={acknowledgeDisclaimer}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-text">
              This tool provides general estimates only and is not financial advice. It was built as a vibecoding exercise to learn how to use Claude. Consult a qualified financial advisor for personalized guidance.
            </p>
            <button className="modal-btn" onClick={acknowledgeDisclaimer}>
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
