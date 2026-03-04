import type { AppState, ProjectionRow } from './types.ts' // ProjectionRow still used by exportCsv

const $ = (n: number) => '$' + n.toFixed(2)

// Spreadsheet column order for export (mirrors v5 spreadsheet layout)
function buildHeaders(includePartner: boolean) {
  return [
    'Year', 'Calendar Year', 'My Age',
    ...(includePartner ? ['Partner Age'] : []),
    'Inflation Multiplier',
    'My Savings while Working',
    ...(includePartner ? ["Partner's Savings while Working"] : []),
    'My Retirement Account Contribution',
    ...(includePartner ? ["Partner's Retirement Account Contribution"] : []),
    'Desired Monthly Cash when Retired (in today\'s dollars)',
    'Pre-tax Annual Social Security Benefit',
    'Post-tax Annual Retirement Income Required',
    'Cash Available from Non-retirement Assets',
    'My Retirement Accounts',
    ...(includePartner ? ["Partner's Retirement Accounts"] : []),
    'Cash Available from Retirement Accounts',
    'My Pre-tax RMD',
    ...(includePartner ? ["Partner's Pre-tax RMD"] : []),
    'Total Post-tax RMD',
    'RMD Contribution to Retirement Income',
    'Surplus RMD to Non-retirement Assets',
    'Remaining Income Need After RMD',
    'Amount Deducted from Non-retirement Assets',
    'Remaining Amount to be Funded',
    'Additional Deduction from Retirement Accounts',
    ...(includePartner ? ['My Portion of Additional Deduction'] : []),
    ...(includePartner ? ["Partner's Portion of Additional Deduction"] : []),
    'Pre-tax Retirement Income ex-Social Security',
    'Non-retirement Assets',
    'Total Retirement Accounts',
    'Nest Egg',
    'Drawdown Rate',
  ]
}

function buildRow(r: ProjectionRow, includePartner: boolean): (string | number)[] {
  return [
    r.yearNum, r.calendarYear, r.yourAge,
    ...(includePartner ? [r.partnerAge] : []),
    r.inflationMultiplier.toFixed(6),
    $(r.yourSavings),
    ...(includePartner ? [$(r.partnerSavings)] : []),
    $(r.yourRetirementContrib),
    ...(includePartner ? [$(r.partnerRetirementContrib)] : []),
    $(r.desiredMonthlyCash),
    $(r.preTaxSocialSecurity),
    $(r.postTaxIncomeRequired),
    $(r.cashAvailableNonRet),
    $(r.yourRetirementAccounts),
    ...(includePartner ? [$(r.partnerRetirementAccounts)] : []),
    $(r.cashAvailableRet),
    $(r.yourRMD),
    ...(includePartner ? [$(r.partnerRMD)] : []),
    $(r.totalPostTaxRMD),
    $(r.rmdToIncome),
    $(r.surplusRMD),
    $(r.remainingIncomeNeed),
    $(r.amountDeductedNonRet),
    $(r.remainingAmountToFund),
    $(r.additionalRetDeduction),
    ...(includePartner ? [$(r.yourAdditionalDeduction)] : []),
    ...(includePartner ? [$(r.partnerAdditionalDeduction)] : []),
    $(r.preTaxRetirementIncome),
    $(r.nonRetirementAssets),
    $(r.retirementAccounts),
    $(r.nestEgg),
    (r.drawdownRate * 100).toFixed(4) + '%',
  ]
}

export function exportCsv(rows: ProjectionRow[], includePartner: boolean) {
  const headers = buildHeaders(includePartner)
  const csvRows = [headers.join(',')]
  for (const r of rows) {
    csvRows.push(buildRow(r, includePartner).join(','))
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'retirement-projection.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportExcel(state: AppState) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  // === SHEET LAYOUT: Inputs in A-B, gap in C, Projections from D onwards ===
  const inputsData: (string | number)[][] = [
    ['Retirement Calculator Inputs', ''],
    ['', ''],
    ['ASSETS', ''],
    ['Non-Retirement Assets', state.nonRetirementAssets],
    ['Real Estate Assets', state.realEstateAssets],
    ['', ''],
    ['YOU', ''],
    ['Current Age', state.yourAge],
    ['Retirement Age', state.yourRetirementAge],
    ['Annual Brokerage Contribution', state.yourBrokerageContribution],
    ['Annual Retirement Contribution', state.yourRetirementContribution],
    ['Retirement Accounts', state.yourRetirementAssets],
    ['Monthly Social Security Benefit', state.yourSocialSecurity],
    ['SS Start Age', state.yourSSStartAge],
    ['', ''],
    ['PARTNER', ''],
    ['Current Age', state.partnerAge],
    ['Retirement Age', state.partnerRetirementAge],
    ['Annual Brokerage Contribution', state.partnerBrokerageContribution],
    ['Annual Retirement Contribution', state.partnerRetirementContribution],
    ['Retirement Accounts', state.partnerRetirementAssets],
    ['Monthly Social Security Benefit', state.partnerSocialSecurity],
    ['SS Start Age', state.partnerSSStartAge],
    ['', ''],
    ['RETIREMENT GOAL', ''],
    ['Desired Monthly Cash When Retired', state.monthlyRetirementCash],
    ['Monthly Cash Supplement (one retired)', state.monthlyPartialRetirementCash],
    ['', ''],
    ['ASSUMPTIONS', ''],
    ['COLA / Inflation', state.cola],
    ['Investment Return', state.investmentReturn],
    ['Capital Gains Tax Rate', state.brokerageTaxRate],
    ['Federal Tax Rate', state.federalTaxRate],
    ['State Tax Rate', state.stateTaxRate],
  ]

  const ws = XLSX.utils.aoa_to_sheet(inputsData)

  // Apply currency format to dollar-value input cells in column B
  // Rows: Non-Ret Assets, Real Estate, Brokerage/Retirement Contribs, Ret Accounts, SS Benefit (yours + partner), Monthly Cash goals
  const dollarInputRows = [4, 5, 10, 11, 12, 13, 19, 20, 21, 22, 26, 27]
  for (const row of dollarInputRows) {
    const cell = `B${row}`
    if (ws[cell]) ws[cell].z = '"$"#,##0.00'
  }

  // Apply percentage format to rate input cells in column B
  // Rows: COLA, Investment Return, Capital Gains Tax Rate, Federal Tax Rate, State Tax Rate
  const percentInputRows = [30, 31, 32, 33, 34]
  for (const row of percentInputRows) {
    const cell = `B${row}`
    if (ws[cell]) ws[cell].z = '0.00%'
  }

  // === PROJECTION COLUMNS — formula-based so inputs drive recalculation ===
  // Always include all columns (partner cols show 0 when $B$17=0).
  // Input cell map:  $B$4=NonRetAssets  $B$5=RealEstate  $B$8=YourAge  $B$9=YourRetAge
  //   $B$10=YourBrokContrib  $B$11=YourRetContrib  $B$12=YourRetAccts  $B$13=YourSS  $B$14=YourSSAge
  //   $B$17=PartnerAge(0=none) $B$18=PartnerRetAge  $B$19=PBrokContrib  $B$20=PRetContrib
  //   $B$21=PRetAccts  $B$22=PartnerSS  $B$23=PartnerSSAge
  //   $B$26=MonthlyRetCash  $B$27=PartialRetCash
  //   $B$30=COLA  $B$31=InvReturn  $B$32=CapGainsTax  $B$33=FedTax  $B$34=StateTax
  const allHeaders = [
    'Year', 'Calendar Year', 'My Age', 'Partner Age', 'Inflation Multiplier',
    'My Savings while Working', "Partner's Savings while Working",
    'My Retirement Account Contribution', "Partner's Retirement Account Contribution",
    "Desired Monthly Cash when Retired (in today's dollars)",
    'Pre-tax Annual Social Security Benefit', 'Post-tax Annual Retirement Income Required',
    'Cash Available from Non-retirement Assets', 'My Retirement Accounts',
    "Partner's Retirement Accounts", 'Cash Available from Retirement Accounts',
    'My Pre-tax RMD', "Partner's Pre-tax RMD", 'Total Post-tax RMD',
    'RMD Contribution to Retirement Income', 'Surplus RMD to Non-retirement Assets',
    'Remaining Income Need After RMD', 'Amount Deducted from Non-retirement Assets',
    'Remaining Amount to be Funded', 'Additional Deduction from Retirement Accounts',
    'My Portion of Additional Deduction', "Partner's Portion of Additional Deduction",
    'Pre-tax Retirement Income ex-Social Security',
    'Non-retirement Assets', 'Total Retirement Accounts', 'Nest Egg', 'Drawdown Rate',
  ]

  allHeaders.forEach((h, i) => {
    const col = XLSX.utils.encode_col(i + 3)
    ws[`${col}1`] = { t: 's', v: h }
  })

  const NUM_ROWS = 90
  for (let i = 0; i < NUM_ROWS; i++) {
    const r = i + 2        // Excel row number (row 1 = header)
    const first = r === 2

    // Previous-year references
    const pNR = first ? '($B$4+$B$5)' : `AF${r - 1}`
    const pYR = first ? '$B$12'        : `Q${r - 1}`
    const pPR = first ? '$B$21'        : `R${r - 1}`

    // Cell writers
    const cur = (col: string, f: string) => { ws[`${col}${r}`] = { t: 'n', f, z: '"$"#,##0.00' } }
    const num = (col: string, f: string) => { ws[`${col}${r}`] = { t: 'n', f } }
    const pct = (col: string, f: string) => { ws[`${col}${r}`] = { t: 'n', f, z: '0.0%' } }

    // D: Year
    num('D', first ? '1' : `D${r - 1}+1`)
    // E: Calendar Year
    num('E', `YEAR(TODAY())+D${r}`)
    // F: My Age
    num('F', `$B$8+D${r}`)
    // G: Partner Age (0 if no partner)
    num('G', `IF($B$17>0,$B$17+D${r},0)`)
    // H: Inflation Multiplier
    num('H', `(1+$B$30)^D${r}`)
    // I: My Savings while Working
    cur('I', `IF(F${r}<=$B$9,$B$10*H${r},0)`)
    // J: Partner's Savings while Working
    cur('J', `IF($B$17>0,IF(G${r}<=$B$18,$B$19*H${r},0),0)`)
    // K: My Retirement Account Contribution
    cur('K', `IF(F${r}<=$B$9,$B$11*H${r},0)`)
    // L: Partner's Retirement Account Contribution
    cur('L', `IF($B$17>0,IF(G${r}<=$B$18,$B$20*H${r},0),0)`)
    // M: Desired Monthly Cash when Retired (today's dollars)
    cur('M', `IF($B$17>0,IF(AND(F${r}>$B$9,G${r}>$B$18),$B$26,IF(OR(F${r}>$B$9,G${r}>$B$18),$B$27,0)),IF(F${r}>$B$9,$B$26,0))`)
    // N: Pre-tax Annual Social Security Benefit
    cur('N', `IF(F${r}>=$B$14,$B$13*12*H${r},0)+IF($B$17>0,IF(G${r}>=$B$23,$B$22*12*H${r},0),0)`)
    // O: Post-tax Annual Retirement Income Required
    cur('O', `12*M${r}*H${r}-N${r}*(1-$B$33)`)
    // P: Cash Available from Non-retirement Assets
    cur('P', `${pNR}*(1-$B$32)`)
    // T: My Pre-tax RMD (needs prev balances; write before Q which depends on it)
    cur('T', `IF(F${r}>=75,IF(${pYR}>0,${pYR}/VLOOKUP(MIN(F${r},104),'RMD Factors'!$A:$B,2,FALSE),0),0)`)
    // U: Partner's Pre-tax RMD
    cur('U', `IF(AND($B$17>0,G${r}>=75),IF(${pPR}>0,${pPR}/VLOOKUP(MIN(G${r},104),'RMD Factors'!$A:$B,2,FALSE),0),0)`)
    // V: Total Post-tax RMD
    cur('V', `(T${r}+U${r})*(1-$B$33-$B$34)`)
    // W: RMD Contribution to Retirement Income
    cur('W', `MIN(MAX(0,O${r}),V${r})`)
    // X: Surplus RMD to Non-retirement Assets
    cur('X', `MAX(0,V${r}-MAX(0,O${r}))`)
    // Y: Remaining Income Need After RMD
    cur('Y', `MAX(0,O${r})-W${r}`)
    // Z: Amount Deducted from Non-retirement Assets (pre-tax)
    cur('Z', `IF(MIN(Y${r},MAX(0,P${r}))>0,MIN(Y${r},MAX(0,P${r}))/(1-$B$32),0)`)
    // AA: Remaining Amount to be Funded (post-tax, after non-ret)
    cur('AA', `MAX(0,Y${r}-MIN(Y${r},MAX(0,P${r})))`)
    // AB: Additional Deduction from Retirement Accounts (capped at available balance)
    cur('AB', `IF(AA${r}>0,MIN(AA${r}/(1-$B$33-$B$34),MAX(0,${pYR}+${pPR}-T${r}-U${r})),0)`)
    // AC: My Portion of Additional Deduction
    cur('AC', `IF(AB${r}>0,MIN(MAX(0,${pYR}-T${r}),AB${r}),0)`)
    // AD: Partner's Portion of Additional Deduction
    cur('AD', `IF(AB${r}>0,MIN(MAX(0,${pPR}-U${r}),AB${r}-AC${r}),0)`)
    // AE: Pre-tax Retirement Income ex-Social Security
    cur('AE', `Z${r}+IF(W${r}>0,W${r}/(1-$B$33-$B$34),0)+AB${r}`)
    // S: Cash Available from Retirement Accounts
    cur('S', `IF(F${r}>59,${pYR}*(1-$B$33-$B$34),0)+IF(AND($B$17>0,G${r}>59),${pPR}*(1-$B$33-$B$34),0)`)
    // Q: My Retirement Accounts (end of year)
    cur('Q', `MAX(0,(${pYR}-T${r}-AC${r})*(1+$B$31)+K${r})`)
    // R: Partner's Retirement Accounts (end of year)
    cur('R', `MAX(0,(${pPR}-U${r}-AD${r})*(1+$B$31)+L${r})`)
    // AF: Non-retirement Assets (end of year)
    cur('AF', `MAX(0,(${pNR}-Z${r}+X${r})*(1+$B$31)+I${r}+J${r})`)
    // AG: Total Retirement Accounts
    cur('AG', `Q${r}+R${r}`)
    // AH: Nest Egg
    cur('AH', `AF${r}+AG${r}`)
    // AI: Drawdown Rate
    pct('AI', `IF(${pNR}+${pYR}+${pPR}>0,MIN(1,AE${r}/(${pNR}+${pYR}+${pPR})),0)`)
  }

  // Set sheet range and column widths
  const lastColIdx = allHeaders.length + 2  // D=3 ... AI=34; last idx = 34
  const lastRowIdx = Math.max(inputsData.length - 1, NUM_ROWS)
  ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: lastColIdx, r: lastRowIdx } })
  ws['!cols'] = [
    { wch: 42 }, { wch: 18 }, { wch: 3 },
    ...allHeaders.map(() => ({ wch: 18 })),
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Retirement Projection')

  // === RMD FACTORS SHEET ===
  const rmdData: (string | number)[][] = [
    ['Age', 'Distribution Period'],
    [75, 24.6], [76, 23.7], [77, 22.9], [78, 22.0], [79, 21.1],
    [80, 20.2], [81, 19.4], [82, 18.5], [83, 17.7], [84, 16.8],
    [85, 16.0], [86, 15.2], [87, 14.4], [88, 13.7], [89, 12.9],
    [90, 12.2], [91, 11.5], [92, 10.8], [93, 10.1], [94,  9.5],
    [95,  8.9], [96,  8.4], [97,  7.8], [98,  7.3], [99,  6.8],
    [100, 6.4], [101, 6.0], [102, 5.6], [103, 5.2], [104, 4.9],
    ['105+', 4.9],
  ]
  const rmdWs = XLSX.utils.aoa_to_sheet(rmdData)
  rmdWs['!cols'] = [{ wch: 10 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, rmdWs, 'RMD Factors')

  XLSX.writeFile(wb, 'retirement-projection.xlsx')
}
