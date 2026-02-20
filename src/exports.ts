import type { AppState, ProjectionRow } from './types.ts'

export function exportCsv(rows: ProjectionRow[], includePartner: boolean) {
  const headers = [
    'Year', 'Calendar Year', 'My Age',
    ...(includePartner ? ['Partner Age'] : []),
    'My Savings While Working',
    ...(includePartner ? ["Partner's Savings While Working"] : []),
    'My Retirement Account Contribution',
    ...(includePartner ? ["Partner's Retirement Account Contribution"] : []),
    'Desired Monthly Cash When Retired',
    'Pre-tax Annual Social Security Benefit',
    'Post-tax Annual Retirement Income Required',
    'Cash Available from Non-retirement Assets',
    'Cash Available from Retirement Accounts',
    'Amount Deducted from Non-retirement Assets',
    'Amount Deducted from Retirement Accounts',
    'Pre-tax Retirement Income',
    'Non-retirement Assets',
    'Retirement Accounts',
    'Nest Egg',
    'Drawdown Rate',
  ]

  const csvRows = [headers.join(',')]
  for (const r of rows) {
    const vals = [
      r.yearNum, r.calendarYear, r.yourAge,
      ...(includePartner ? [r.partnerAge] : []),
      r.yourSavings.toFixed(2),
      ...(includePartner ? [r.partnerSavings.toFixed(2)] : []),
      r.yourRetirementContrib.toFixed(2),
      ...(includePartner ? [r.partnerRetirementContrib.toFixed(2)] : []),
      r.desiredMonthlyCash.toFixed(2),
      r.preTaxSocialSecurity.toFixed(2),
      r.postTaxIncomeRequired.toFixed(2),
      r.cashAvailableNonRet.toFixed(2),
      r.cashAvailableRet.toFixed(2),
      r.amountDeductedNonRet.toFixed(2),
      r.amountDeductedRet.toFixed(2),
      r.preTaxRetirementIncome.toFixed(2),
      r.nonRetirementAssets.toFixed(2),
      r.retirementAccounts.toFixed(2),
      r.nestEgg.toFixed(2),
      (r.drawdownRate * 100).toFixed(4) + '%',
    ]
    csvRows.push(vals.join(','))
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'retirement-projection.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportExcel(state: AppState, rowCount: number) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  // === SINGLE SHEET: Inputs in A-B, gap in C, Projections from D onwards ===
  const inputsData: (string | number)[][] = [
    ['Retirement Calculator Inputs', ''],
    ['', ''],
    ['ASSETS', ''],
    ['Non-Retirement Assets', state.nonRetirementAssets],         // B4
    ['Retirement Assets', state.retirementAssets],                // B5
    ['Real Estate Assets', state.realEstateAssets],               // B6
    ['', ''],
    ['YOU', ''],
    ['Current Age', state.yourAge],                               // B9
    ['Retirement Age', state.yourRetirementAge],                  // B10
    ['Annual Brokerage Contribution', state.yourBrokerageContribution],  // B11
    ['Annual Retirement Contribution', state.yourRetirementContribution], // B12
    ['Monthly Social Security Benefit', state.yourSocialSecurity], // B13
    ['SS Start Age', state.yourSSStartAge],                       // B14
    ['', ''],
    ['PARTNER', ''],
    ['Current Age', state.partnerAge],                            // B17
    ['Retirement Age', state.partnerRetirementAge],               // B18
    ['Annual Brokerage Contribution', state.partnerBrokerageContribution],  // B19
    ['Annual Retirement Contribution', state.partnerRetirementContribution], // B20
    ['Monthly Social Security Benefit', state.partnerSocialSecurity], // B21
    ['SS Start Age', state.partnerSSStartAge],                    // B22
    ['', ''],
    ['RETIREMENT GOAL', ''],
    ['Desired Monthly Cash When Retired', state.monthlyRetirementCash],    // B25
    ['Monthly Cash Supplement (one retired)', state.monthlyPartialRetirementCash], // B26
    ['', ''],
    ['ASSUMPTIONS', ''],
    ['COLA / Inflation', state.cola],               // B29
    ['Investment Return', state.investmentReturn],   // B30
    ['Capital Gains Tax Rate', state.brokerageTaxRate],  // B31
    ['Federal Tax Rate', state.federalTaxRate],      // B32
    ['State Tax Rate', state.stateTaxRate],          // B33
  ]

  const ws = XLSX.utils.aoa_to_sheet(inputsData)

  // === INPUT CELL REFERENCES (same sheet, absolute) ===
  const $ = {
    nonRet: '$B$4', ret: '$B$5', realEstate: '$B$6',
    yourAge: '$B$9', yourRetAge: '$B$10',
    yourBrokContrib: '$B$11', yourRetContrib: '$B$12',
    yourSS: '$B$13', yourSSAge: '$B$14',
    partnerAge: '$B$17', partnerRetAge: '$B$18',
    partnerBrokContrib: '$B$19', partnerRetContrib: '$B$20',
    partnerSS: '$B$21', partnerSSAge: '$B$22',
    monthlyRetCash: '$B$25', monthlyPartialCash: '$B$26',
    cola: '$B$29', invReturn: '$B$30',
    brokTax: '$B$31', fedTax: '$B$32', stateTax: '$B$33',
  }
  const combinedTax = `(${$.fedTax}+${$.stateTax})`

  // === PROJECTION COLUMNS (starting at D, col index 3) ===
  // D=Year, E=CalYear, F=MyAge, G=PartnerAge, H=InflationMult,
  // I=MySavings, J=PartnerSavings, K=MyRetContrib, L=PartnerRetContrib,
  // M=DesiredCash, N=PreTaxSS, O=PostTaxRequired,
  // P=CashAvailNonRet, Q=CashAvailRet,
  // R=DeductedNonRet, S=DeductedRet, T=PreTaxRetIncome,
  // U=NonRetAssets, V=RetAccounts, W=NestEgg, X=DrawdownRate

  const headers = [
    'Year', 'Calendar Year', 'My Age', 'Partner Age',
    'Inflation Multiplier',
    'My Savings While Working', "Partner's Savings While Working",
    'My Retirement Contribution', "Partner's Retirement Contribution",
    'Desired Monthly Cash',
    'Pre-tax Annual Social Security',
    'Post-tax Income Required',
    'Cash Available Non-Ret', 'Cash Available Ret',
    'Deducted Non-Ret', 'Deducted Ret',
    'Pre-tax Retirement Income',
    'Non-Retirement Assets', 'Retirement Accounts',
    'Nest Egg', 'Drawdown Rate',
  ]

  // Write projection headers into row 1, starting at column D
  headers.forEach((h, i) => {
    const col = XLSX.utils.encode_col(i + 3) // D=3, E=4, ...
    ws[`${col}1`] = { t: 's', v: h }
  })

  const currentYear = new Date().getFullYear()
  const initNonRet = `(${$.nonRet}+${$.realEstate})`
  const initRet = $.ret

  for (let i = 0; i < rowCount; i++) {
    const r = i + 2 // Excel row (1-indexed; row 1 = headers)
    const prev = r - 1
    const first = i === 0

    const prevNonRet = first ? initNonRet : `U${prev}`
    const prevRetAcct = first ? initRet : `V${prev}`

    // D: Year number
    ws[`D${r}`] = { t: 'n', v: i + 1 }

    // E: Calendar year
    ws[`E${r}`] = { t: 'n', f: `${currentYear}+D${r}` }

    // F: My Age
    ws[`F${r}`] = { t: 'n', f: `${$.yourAge}+D${r}` }

    // G: Partner Age
    ws[`G${r}`] = { t: 'n', f: `IF(${$.partnerAge}>0,${$.partnerAge}+D${r},0)` }

    // H: Inflation Multiplier
    ws[`H${r}`] = { t: 'n', f: `(1+${$.cola})^D${r}` }

    // I: My Savings While Working
    ws[`I${r}`] = { t: 'n', f: `IF(F${r}<=${$.yourRetAge},${$.yourBrokContrib}*H${r},0)` }

    // J: Partner Savings While Working
    ws[`J${r}`] = { t: 'n', f: `IF(AND(${$.partnerAge}>0,G${r}<=${$.partnerRetAge}),${$.partnerBrokContrib}*H${r},0)` }

    // K: My Retirement Contribution
    ws[`K${r}`] = { t: 'n', f: `IF(F${r}<=${$.yourRetAge},${$.yourRetContrib}*H${r},0)` }

    // L: Partner Retirement Contribution
    ws[`L${r}`] = { t: 'n', f: `IF(AND(${$.partnerAge}>0,G${r}<=${$.partnerRetAge}),${$.partnerRetContrib}*H${r},0)` }

    // M: Desired Monthly Cash (depends on who is retired)
    ws[`M${r}`] = { t: 'n', f:
      `IF(${$.partnerAge}>0,` +
        `IF(AND(F${r}>${$.yourRetAge},G${r}>${$.partnerRetAge}),${$.monthlyRetCash},` +
          `IF(OR(F${r}>${$.yourRetAge},G${r}>${$.partnerRetAge}),${$.monthlyPartialCash},0)),` +
        `IF(F${r}>${$.yourRetAge},${$.monthlyRetCash},0))`
    }

    // N: Pre-tax Annual Social Security
    ws[`N${r}`] = { t: 'n', f:
      `IF(F${r}>=${$.yourSSAge},${$.yourSS}*12*H${r},0)` +
      `+IF(AND(${$.partnerAge}>0,G${r}>=${$.partnerSSAge}),${$.partnerSS}*12*H${r},0)`
    }

    // O: Post-tax Income Required
    ws[`O${r}`] = { t: 'n', f:
      `12*M${r}*H${r}-N${r}*(1-${combinedTax})`
    }

    // P: Cash Available from Non-Retirement Assets
    ws[`P${r}`] = { t: 'n', f: `${prevNonRet}*(1-${$.brokTax})` }

    // Q: Cash Available from Retirement Accounts (accessible after age 59)
    const retAccess = `OR(F${r}>59,AND(G${r}>0,G${r}>59))`
    ws[`Q${r}`] = { t: 'n', f: `IF(${retAccess},${prevRetAcct}*(1-${combinedTax}),0)` }

    // R: Amount Deducted Non-Ret
    const postTaxNonRet = `MIN(MAX(0,O${r}),MAX(0,P${r}))`
    ws[`R${r}`] = { t: 'n', f:
      `IF(${postTaxNonRet}>0,${postTaxNonRet}/(1-${$.brokTax}),0)`
    }

    // S: Amount Deducted Ret
    const postTaxStillNeeded = `MAX(0,MAX(0,O${r})-${postTaxNonRet})`
    ws[`S${r}`] = { t: 'n', f:
      `IF(${postTaxStillNeeded}>0,${postTaxStillNeeded}/(1-${combinedTax}),0)`
    }

    // T: Pre-tax Retirement Income
    ws[`T${r}`] = { t: 'n', f: `R${r}+S${r}` }

    // U: Non-Retirement Assets
    ws[`U${r}`] = { t: 'n', f:
      `MAX(0,(${prevNonRet}-R${r})*(1+${$.invReturn})+I${r}+J${r})`
    }

    // V: Retirement Accounts
    ws[`V${r}`] = { t: 'n', f:
      `MAX(0,(${prevRetAcct}-S${r})*(1+${$.invReturn})+K${r}+L${r})`
    }

    // W: Nest Egg
    ws[`W${r}`] = { t: 'n', f: `U${r}+V${r}` }

    // X: Drawdown Rate
    ws[`X${r}`] = { t: 'n', f: `IF(W${r}>0,T${r}/W${r},0)` }
  }

  // Set sheet range: A1 to X{lastDataRow}
  const lastRow = Math.max(inputsData.length, rowCount + 1)
  ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 23, r: lastRow - 1 } })

  // Column widths: A=labels, B=values, C=gap, D-X=projection cols
  ws['!cols'] = [
    { wch: 42 }, { wch: 18 }, { wch: 3 },
    ...headers.map(() => ({ wch: 20 })),
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Retirement Projection')
  XLSX.writeFile(wb, 'retirement-projection.xlsx')
}
