import type { AppState, ProjectionRow } from './types.ts'

/**
 * Calculate inflation-adjusted contributions while still working
 */
function calculateContributions(
  currentAge: number,
  retirementAge: number,
  brokerageContribution: number,
  retirementContribution: number,
  inflationMultiplier: number
): { savings: number; retirementContrib: number } {
  const isStillWorking = currentAge <= retirementAge
  return {
    savings: isStillWorking ? brokerageContribution * inflationMultiplier : 0,
    retirementContrib: isStillWorking ? retirementContribution * inflationMultiplier : 0,
  }
}

/**
 * Determine monthly cash needs based on retirement status
 */
function calculateDesiredMonthlyCash(
  hasPartner: boolean,
  youRetired: boolean,
  partnerRetired: boolean,
  monthlyRetirementCash: number,
  monthlyPartialRetirementCash: number
): number {
  const fullyRetired = youRetired && (!hasPartner || partnerRetired)
  const someoneRetired = youRetired || partnerRetired

  if (hasPartner) {
    if (fullyRetired) return monthlyRetirementCash
    if (someoneRetired) return monthlyPartialRetirementCash
    return 0
  }
  return youRetired ? monthlyRetirementCash : 0
}

/**
 * Calculate annual Social Security benefits (inflation-adjusted)
 */
function calculateSocialSecurity(
  currentAge: number,
  ssStartAge: number,
  monthlySS: number,
  inflationMultiplier: number
): number {
  return currentAge >= ssStartAge ? monthlySS * 12 * inflationMultiplier : 0
}

/**
 * Calculate post-tax income needed from assets
 * Formula: (desired annual cash) - (post-tax Social Security)
 * Note: Social Security is only taxed at the federal rate, not state.
 */
function calculatePostTaxIncomeRequired(
  desiredMonthlyCash: number,
  inflationMultiplier: number,
  preTaxSocialSecurity: number,
  combinedTaxRate: number,
  federalTaxRate: number
): number {
  const annualCashNeeded = 12 * desiredMonthlyCash * inflationMultiplier
  const postTaxSocialSecurity = preTaxSocialSecurity * (1 - federalTaxRate)
  return annualCashNeeded - postTaxSocialSecurity
}

/**
 * Calculate withdrawals from each account type
 * Priority: Use non-retirement first (lower tax), then retirement accounts
 */
function calculateWithdrawals(
  postTaxIncomeRequired: number,
  cashAvailableNonRet: number,
  brokerageTaxRate: number,
  combinedTaxRate: number
): { amountDeductedNonRet: number; amountDeductedRet: number } {
  // Post-tax from non-retirement (capped at what we need)
  const postTaxFromNonRet = Math.min(
    Math.max(0, postTaxIncomeRequired),
    Math.max(0, cashAvailableNonRet)
  )

  // Convert to pre-tax withdrawal
  const amountDeductedNonRet = postTaxFromNonRet > 0
    ? postTaxFromNonRet / (1 - brokerageTaxRate)
    : 0

  // Remaining need from retirement accounts
  const postTaxStillNeeded = Math.max(0, postTaxIncomeRequired) - postTaxFromNonRet
  const amountDeductedRet = postTaxStillNeeded > 0
    ? postTaxStillNeeded / (1 - combinedTaxRate)
    : 0

  return { amountDeductedNonRet, amountDeductedRet }
}

/**
 * Update account balance after withdrawals, growth, and contributions
 * Formula: (previous - withdrawal) * (1 + return) + contributions
 */
function calculateNewBalance(
  previousBalance: number,
  withdrawal: number,
  investmentReturn: number,
  contributions: number
): number {
  const newBalance = (previousBalance - withdrawal) * (1 + investmentReturn) + contributions
  return Math.max(0, newBalance)
}

/**
 * Generate year-by-year retirement projections
 */
export function generateProjections(state: AppState): ProjectionRow[] {
  const {
    nonRetirementAssets, retirementAssets, realEstateAssets,
    yourAge, yourRetirementAge, yourBrokerageContribution, yourRetirementContribution,
    yourSocialSecurity, yourSSStartAge,
    partnerAge, partnerRetirementAge, partnerBrokerageContribution, partnerRetirementContribution,
    partnerSocialSecurity, partnerSSStartAge,
    monthlyRetirementCash, monthlyPartialRetirementCash,
    cola, investmentReturn, brokerageTaxRate, federalTaxRate, stateTaxRate,
  } = state

  const hasPartner = partnerAge > 0
  const combinedTaxRate = federalTaxRate + stateTaxRate
  const currentYear = new Date().getFullYear()
  const maxYears = 125 - yourAge

  const rows: ProjectionRow[] = []
  let prevNonRetirement = nonRetirementAssets + realEstateAssets
  let prevRetirement = retirementAssets

  for (let i = 0; i < maxYears; i++) {
    const yearNum = i + 1
    const calendarYear = currentYear + yearNum
    const currentYourAge = yourAge + yearNum
    const currentPartnerAge = hasPartner ? partnerAge + yearNum : 0
    const inflationMultiplier = Math.pow(1 + cola, yearNum)

    // Step 1: Calculate contributions (while working)
    const yourContribs = calculateContributions(
      currentYourAge, yourRetirementAge,
      yourBrokerageContribution, yourRetirementContribution,
      inflationMultiplier
    )
    const partnerContribs = hasPartner
      ? calculateContributions(
          currentPartnerAge, partnerRetirementAge,
          partnerBrokerageContribution, partnerRetirementContribution,
          inflationMultiplier
        )
      : { savings: 0, retirementContrib: 0 }

    // Step 2: Determine retirement status and cash needs
    const youRetired = currentYourAge > yourRetirementAge
    const partnerRetired = hasPartner ? currentPartnerAge > partnerRetirementAge : false
    const desiredMonthlyCash = calculateDesiredMonthlyCash(
      hasPartner, youRetired, partnerRetired,
      monthlyRetirementCash, monthlyPartialRetirementCash
    )

    // Step 3: Calculate Social Security income
    const yourSSBenefit = calculateSocialSecurity(
      currentYourAge, yourSSStartAge, yourSocialSecurity, inflationMultiplier
    )
    const partnerSSBenefit = hasPartner
      ? calculateSocialSecurity(currentPartnerAge, partnerSSStartAge, partnerSocialSecurity, inflationMultiplier)
      : 0
    const preTaxSocialSecurity = yourSSBenefit + partnerSSBenefit

    // Step 4: Calculate income requirements and availability
    const postTaxIncomeRequired = calculatePostTaxIncomeRequired(
      desiredMonthlyCash, inflationMultiplier, preTaxSocialSecurity, combinedTaxRate, federalTaxRate
    )
    const cashAvailableNonRet = prevNonRetirement * (1 - brokerageTaxRate)
    const canAccessRetirement = currentYourAge > 59 || (hasPartner && currentPartnerAge > 59)
    const cashAvailableRet = canAccessRetirement ? prevRetirement * (1 - combinedTaxRate) : 0

    // Step 5: Calculate withdrawals
    const { amountDeductedNonRet, amountDeductedRet } = calculateWithdrawals(
      postTaxIncomeRequired, cashAvailableNonRet, brokerageTaxRate, combinedTaxRate
    )
    const preTaxRetirementIncome = amountDeductedNonRet + amountDeductedRet

    // Step 6: Update account balances
    const totalSavings = yourContribs.savings + partnerContribs.savings
    const totalRetirementContribs = yourContribs.retirementContrib + partnerContribs.retirementContrib

    const nonRetirementAssetsCurrent = calculateNewBalance(
      prevNonRetirement, amountDeductedNonRet, investmentReturn, totalSavings
    )
    const retirementAccountsCurrent = calculateNewBalance(
      prevRetirement, amountDeductedRet, investmentReturn, totalRetirementContribs
    )
    const nestEgg = nonRetirementAssetsCurrent + retirementAccountsCurrent

    // Step 7: Calculate drawdown rate
    const drawdownRate = nestEgg > 0 ? preTaxRetirementIncome / nestEgg : 0

    rows.push({
      yearNum,
      calendarYear,
      yourAge: currentYourAge,
      partnerAge: currentPartnerAge,
      yourSavings: yourContribs.savings,
      partnerSavings: partnerContribs.savings,
      yourRetirementContrib: yourContribs.retirementContrib,
      partnerRetirementContrib: partnerContribs.retirementContrib,
      desiredMonthlyCash,
      preTaxSocialSecurity,
      postTaxIncomeRequired,
      cashAvailableNonRet,
      cashAvailableRet,
      amountDeductedNonRet,
      amountDeductedRet,
      preTaxRetirementIncome,
      nonRetirementAssets: nonRetirementAssetsCurrent,
      retirementAccounts: retirementAccountsCurrent,
      nestEgg,
      drawdownRate,
    })

    // Update for next iteration
    prevNonRetirement = nonRetirementAssetsCurrent
    prevRetirement = retirementAccountsCurrent

    // Stop conditions: age reaches 125 or nest egg depleted
    if (currentYourAge >= 125) break
    if (nestEgg <= 0) break
  }

  return rows
}
