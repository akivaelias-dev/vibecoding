import { useState } from 'react'
import './App.css'
import { useAppState } from './hooks/useAppState.ts'
import { CurrencyInput, NumberInput, PercentInput, Card } from './components/inputs.tsx'
import { NestEggChart } from './components/NestEggChart.tsx'
import { ScenarioSummary } from './components/ScenarioSummary.tsx'
import { ProjectionTable } from './components/ProjectionTable.tsx'
import { DisclaimerModal } from './components/DisclaimerModal.tsx'
import { DisclaimerPage } from './components/DisclaimerPage.tsx'

function App() {
  const app = useAppState()
  const [showDisclaimerPage, setShowDisclaimerPage] = useState(false)
  const [modalDismissed, setModalDismissed] = useState(false)

  if (showDisclaimerPage) {
    return <DisclaimerPage onBack={() => { setShowDisclaimerPage(false); window.scrollTo(0, 0) }} />
  }

  return (
    <div className="app-container">
      <header className="header animate-fade-in-up">
        <h1>How Am I Looking?</h1>
        <p>A quick check on your retirement trajectory</p>
      </header>

      <div className="main-content">
        {/* ===== Sidebar: Input Forms ===== */}
        <aside className="sidebar">
          <Card
            title="Assets"
            className="animate-fade-in-up delay-2"
            titleTooltip="Any debt that you currently service we assume is part of your existing lifestyle and cash flow management"
          >
            <CurrencyInput
              label="Non-Retirement Assets"
              value={app.nonRetirementAssets}
              onChange={app.setNonRetirementAssets}
              tooltip="Savings/investment accounts; exclude unvested shares, 529s, gift accounts"
            />
            <CurrencyInput
              label="Real Estate"
              value={app.realEstateAssets}
              onChange={app.setRealEstateAssets}
              tooltip="Exclude the home you live in; include value of other real estate assets minus the mortgage loans"
            />
          </Card>

          <Card title="You" className="animate-fade-in-up delay-3">
            <NumberInput
              label="Current Age"
              value={app.yourAge}
              onChange={(v) => { app.setYourAge(v); if (app.yourRetirementAge <= v) app.setYourRetirementAge(v + 1) }}
              min={0} max={100}
            />
            <NumberInput label="Retirement Age" value={app.yourRetirementAge} onChange={app.setYourRetirementAge} min={app.yourAge + 1} max={100} />
            <CurrencyInput label="Retirement Accounts" value={app.yourRetirementAssets} onChange={app.setYourRetirementAssets} tooltip="Your IRAs, 401(k)s, etc." />
            <CurrencyInput
              label="Annual Brokerage Contribution"
              value={app.yourBrokerageContribution}
              onChange={app.setYourBrokerageContribution}
              tooltip="Annual contribution to brokerage/investment accounts while working (today's dollars)"
            />
            <CurrencyInput
              label="Annual Retirement Contribution"
              value={app.yourRetirementContribution}
              onChange={app.setYourRetirementContribution}
              tooltip="Annual contribution to retirement accounts while working (today's dollars)"
            />
            <CurrencyInput
              label="Monthly Social Security Benefit"
              value={app.yourSocialSecurity}
              onChange={app.setYourSocialSecurity}
              tooltip="Expected monthly pre-tax benefit in today's dollars (see ssa.gov)"
            />
            <NumberInput label="Collect Social Security Benefit from Age" value={app.yourSSStartAge} onChange={app.setYourSSStartAge} min={62} max={70} />
          </Card>

          {app.showPartner ? (
            <Card
              title="Partner"
              className="animate-fade-in-up delay-4"
              titleExtra={
                <button className="remove-partner-btn" onClick={() => app.setShowPartner(false)}>
                  Remove
                </button>
              }
            >
              <NumberInput
                label="Current Age"
                value={app.partnerAge}
                onChange={(v) => { app.setPartnerAge(v); if (app.partnerRetirementAge <= v) app.setPartnerRetirementAge(v + 1) }}
                min={0} max={100}
              />
              <NumberInput label="Retirement Age" value={app.partnerRetirementAge} onChange={app.setPartnerRetirementAge} min={app.partnerAge + 1} max={100} />
              <CurrencyInput label="Retirement Accounts" value={app.partnerRetirementAssets} onChange={app.setPartnerRetirementAssets} tooltip="Partner's IRAs, 401(k)s, etc." />
              <CurrencyInput label="Annual Brokerage Contribution" value={app.partnerBrokerageContribution} onChange={app.setPartnerBrokerageContribution} />
              <CurrencyInput label="Annual Retirement Contribution" value={app.partnerRetirementContribution} onChange={app.setPartnerRetirementContribution} />
              <CurrencyInput label="Monthly Social Security Benefit" value={app.partnerSocialSecurity} onChange={app.setPartnerSocialSecurity} />
              <NumberInput label="Collect Social Security Benefit from Age" value={app.partnerSSStartAge} onChange={app.setPartnerSSStartAge} min={62} max={70} />
            </Card>
          ) : (
            <button className="add-partner-btn animate-fade-in-up delay-4" onClick={() => app.setShowPartner(true)}>
              + Add Partner / Spouse
            </button>
          )}

          <Card
            title="Retirement Goal"
            className="animate-fade-in-up delay-5"
            titleTooltip="The model does not take into consideration any inheritance or pension that you may expect; adjust the desired monthly cash to account for such future cash flows"
          >
            <CurrencyInput
              label="Desired Monthly Cash when Retired"
              value={app.monthlyRetirementCash}
              onChange={app.setMonthlyRetirementCash}
              tooltip="Desired after-tax monthly retirement income in today's dollars (assumes you and your partner are not working)"
            />
            {app.showPartner && (
              <CurrencyInput
                label="Monthly Cash Supplement (one retired)"
                value={app.monthlyPartialRetirementCash}
                onChange={app.setMonthlyPartialRetirementCash}
                tooltip="After-tax amount needed from nest egg in today's dollars, to cover for one less income when the first person retires"
              />
            )}
          </Card>

          <Card
            title="Assumptions"
            className="animate-fade-in-up delay-5"
            titleExtra={<button className="reset-link" onClick={app.resetAssumptions}>Reset</button>}
          >
            <PercentInput label="COLA / Inflation" value={app.cola} onChange={app.setCola} tooltip="Cost-of-Living Adjustment" />
            <PercentInput label="Investment Return" value={app.investmentReturn} onChange={app.setInvestmentReturn} />
            <PercentInput label="Capital Gains Tax Rate" value={app.brokerageTaxRate} onChange={app.setBrokerageTaxRate} tooltip="Effective tax rate when you withdraw funds from your brokerage/investment accounts" max={1} />
            <PercentInput label="Federal Tax Rate" value={app.federalTaxRate} onChange={app.setFederalTaxRate} tooltip="Enter an appropriate tax rate based on your retirement income tax bracket" max={1} />
            <PercentInput label="State Tax Rate" value={app.stateTaxRate} onChange={app.setStateTaxRate} tooltip="The tax rate based on your retirement income tax bracket for the state in which you plan to retire in" max={1} />
          </Card>
        </aside>

        {/* ===== Main: Charts and Projections ===== */}
        <main>
          <ScenarioSummary
            pessimistic={app.pessimisticScenario}
            base={app.baseScenario}
            optimistic={app.optimisticScenario}
          />
          <NestEggChart data={app.projections} retirementAge={app.yourRetirementAge} />
          <ProjectionTable
            projections={app.projections}
            showPartner={app.showPartner}
            yourRetirementAge={app.yourRetirementAge}
            partnerRetirementAge={app.partnerRetirementAge}
            yourSSStartAge={app.yourSSStartAge}
            partnerSSStartAge={app.partnerSSStartAge}
            state={app.state}
            isDepleted={app.baseScenario.isDepleted}
          />
        </main>
      </div>

      <div className="disclaimer">
        This tool provides general estimates only and is not financial advice. Consult a qualified financial advisor for personalized guidance.<br />
        <button className="disclaimer-link" onClick={() => { setShowDisclaimerPage(true); window.scrollTo(0, 0) }}>
          Disclaimer
        </button>
      </div>

      {!modalDismissed && <DisclaimerModal onAcknowledge={() => setModalDismissed(true)} />}
    </div>
  )
}

export default App
