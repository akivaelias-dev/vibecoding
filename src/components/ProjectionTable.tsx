import { useState } from 'react'
import type { AppState, ProjectionRow } from '../types.ts'
import { formatCurrency, formatCurrencyFull } from '../formatters.ts'
import { exportCsv, exportExcel } from '../exports.ts'

interface ProjectionTableProps {
  projections: ProjectionRow[]
  showPartner: boolean
  yourRetirementAge: number
  partnerRetirementAge: number
  yourSSStartAge: number
  partnerSSStartAge: number
  state: AppState
  isDepleted: boolean
}

export function ProjectionTable({
  projections,
  showPartner,
  yourRetirementAge,
  partnerRetirementAge,
  yourSSStartAge,
  partnerSSStartAge,
  state,
  isDepleted,
}: ProjectionTableProps) {
  const [showAllColumns, setShowAllColumns] = useState(false)

  return (
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
              {showAllColumns && <th>Total Post-tax RMD</th>}
              {showAllColumns && <th>Surplus RMD to Non-Ret Assets</th>}
              {showAllColumns && <th>Amount Deducted from Non-retirement Assets</th>}
              {showAllColumns && <th>Remaining Amount to be Funded</th>}
              {showAllColumns && <th>Additional Amount Deducted from Retirement Accounts</th>}
              <th className="col-currency">Pre-tax Retirement Income ex-Social Security</th>
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
                  {showAllColumns && <td>{formatCurrency(row.totalPostTaxRMD)}</td>}
                  {showAllColumns && <td>{formatCurrency(row.surplusRMD)}</td>}
                  {showAllColumns && <td>{formatCurrency(row.amountDeductedNonRet)}</td>}
                  {showAllColumns && <td>{formatCurrency(row.remainingAmountToFund)}</td>}
                  {showAllColumns && <td>{formatCurrency(row.amountDeductedRet)}</td>}
                  <td>{formatCurrency(row.preTaxRetirementIncome)}</td>
                  <td>{formatCurrency(row.nonRetirementAssets)}</td>
                  <td>{formatCurrency(row.retirementAccounts)}</td>
                  <td className={`nest-egg ${isRowDepleted ? 'warning' : ''}`}>
                    {formatCurrency(row.nestEgg)}
                  </td>
                  <td className="highlight">
                    {row.drawdownRate > 0 ? (row.drawdownRate * 100).toFixed(1) + '%' : '—'}
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
          <button className="export-csv-btn" onClick={() => exportExcel(state)}>
            Download Excel
          </button>
        </div>
      </div>
    </div>
  )
}
