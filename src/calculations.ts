import type { AppState, ProjectionRow } from './types.ts'

/**
 * IRS Uniform Lifetime Table (SECURE Act 2.0) — used for RMD calculations.
 * RMD begins at age 75. Factor at age 105+ floors at 4.9.
 */
const RMD_FACTORS: Record<number, number> = {
  75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8,
  85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9,
  90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94:  9.5,
  95:  8.9, 96:  8.4, 97:  7.8, 98:  7.3, 99:  6.8,
 100:  6.4,101:  6.0,102:  5.6,103:  5.2,104:  4.9,
}
const RMD_FLOOR_FACTOR = 4.9

/**
 * Calculate the pre-tax Required Minimum Distribution for a given age and balance.
 * Returns 0 before age 75.
 */
function getRMD(age: number, balance: number): number {
  if (age < 75 || balance <= 0) return 0
  const factor = RMD_FACTORS[age] ?? RMD_FLOOR_FACTOR
  return balance / factor
}

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
 * Calculate post-tax income needed from assets.
 * Formula: (desired annual cash) - (post-tax Social Security)
 * Note: Social Security is only taxed at the federal rate, not state.
 */
function calculatePostTaxIncomeRequired(
  desiredMonthlyCash: number,
  inflationMultiplier: number,
  preTaxSocialSecurity: number,
  federalTaxRate: number
): number {
  const annualCashNeeded = 12 * desiredMonthlyCash * inflationMultiplier
  const postTaxSocialSecurity = preTaxSocialSecurity * (1 - federalTaxRate)
  return annualCashNeeded - postTaxSocialSecurity
}

/**
 * Generate year-by-year retirement projections
 */
export function generateProjections(state: AppState): ProjectionRow[] {
  const {
    nonRetirementAssets, yourRetirementAssets, partnerRetirementAssets, realEstateAssets,
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
  let prevYourRetirement = yourRetirementAssets
  let prevPartnerRetirement = partnerRetirementAssets

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

    // Step 4: Calculate income requirements and non-retirement availability
    const postTaxIncomeRequired = calculatePostTaxIncomeRequired(
      desiredMonthlyCash, inflationMultiplier, preTaxSocialSecurity, federalTaxRate
    )
    const cashAvailableNonRet = prevNonRetirement * (1 - brokerageTaxRate)
    const yourCashAvailableRet = currentYourAge > 59 ? prevYourRetirement * (1 - combinedTaxRate) : 0
    const partnerCashAvailableRet = hasPartner && currentPartnerAge > 59 ? prevPartnerRetirement * (1 - combinedTaxRate) : 0
    const cashAvailableRet = yourCashAvailableRet + partnerCashAvailableRet

    // Step 5: Calculate RMDs (age 75+, drawn from previous year's balance)
    const yourPreTaxRMD = getRMD(currentYourAge, prevYourRetirement)
    const partnerPreTaxRMD = hasPartner ? getRMD(currentPartnerAge, prevPartnerRetirement) : 0
    const yourPostTaxRMD = yourPreTaxRMD * (1 - combinedTaxRate)
    const partnerPostTaxRMD = partnerPreTaxRMD * (1 - combinedTaxRate)
    const totalPostTaxRMD = yourPostTaxRMD + partnerPostTaxRMD

    // Step 6: Apply RMD toward income need; surplus reinvests in non-retirement
    const incomeNeeded = Math.max(0, postTaxIncomeRequired)
    const rmdToIncome = Math.min(incomeNeeded, totalPostTaxRMD)
    const surplusRMD = Math.max(0, totalPostTaxRMD - incomeNeeded) // post-tax
    const remainingIncomeNeed = Math.max(0, incomeNeeded - rmdToIncome)

    // Step 7: Additional withdrawals to cover remaining need
    // Non-retirement first (lower tax rate), then retirement
    const postTaxFromNonRet = Math.min(remainingIncomeNeed, Math.max(0, cashAvailableNonRet))
    const amountDeductedNonRet = postTaxFromNonRet > 0
      ? postTaxFromNonRet / (1 - brokerageTaxRate)
      : 0

    const postTaxStillNeeded = Math.max(0, remainingIncomeNeed - postTaxFromNonRet)
    const uncappedAdditionalRetDeduction = postTaxStillNeeded > 0
      ? postTaxStillNeeded / (1 - combinedTaxRate)
      : 0
    const maxAdditionalFromRet = Math.max(0, prevYourRetirement + prevPartnerRetirement - yourPreTaxRMD - partnerPreTaxRMD)
    const additionalRetDeduction = Math.min(uncappedAdditionalRetDeduction, maxAdditionalFromRet)

    // Step 8: Split additional retirement deduction — draw from your account first
    const yourAvailableForExtra = Math.max(0, prevYourRetirement - yourPreTaxRMD)
    const yourAdditionalDeduction = Math.min(yourAvailableForExtra, additionalRetDeduction)
    const partnerAvailableForExtra = Math.max(0, prevPartnerRetirement - partnerPreTaxRMD)
    const partnerAdditionalDeduction = Math.min(
      partnerAvailableForExtra,
      additionalRetDeduction - yourAdditionalDeduction
    )

    // Total pre-tax deducted from retirement accounts (RMD + additional voluntary)
    const amountDeductedRet =
      yourPreTaxRMD + partnerPreTaxRMD + yourAdditionalDeduction + partnerAdditionalDeduction

    // Step 9: Pre-tax retirement income (income-contributing portion only, ex-SS)
    // Matches spreadsheet AB = U/(1-tax) + Y + X, using the theoretical Y (additionalRetDeduction),
    // not the balance-capped split — balances are separately floored at 0.
    const rmdToIncome_preTax = rmdToIncome > 0 ? rmdToIncome / (1 - combinedTaxRate) : 0
    const preTaxRetirementIncome = amountDeductedNonRet + rmdToIncome_preTax + additionalRetDeduction

    // Step 10: Update account balances
    const totalSavings = yourContribs.savings + partnerContribs.savings

    // Surplus RMD (already post-tax) is reinvested into non-retirement
    const nonRetirementAssetsCurrent = Math.max(0,
      (prevNonRetirement - amountDeductedNonRet + surplusRMD) * (1 + investmentReturn) + totalSavings
    )

    // Each retirement account reduced by its own RMD + its share of additional deduction
    const yourRetirementAccountsCurrent = Math.max(0,
      (prevYourRetirement - yourPreTaxRMD - yourAdditionalDeduction) * (1 + investmentReturn) +
      yourContribs.retirementContrib
    )
    const partnerRetirementAccountsCurrent = Math.max(0,
      (prevPartnerRetirement - partnerPreTaxRMD - partnerAdditionalDeduction) * (1 + investmentReturn) +
      partnerContribs.retirementContrib
    )
    const retirementAccountsCurrent = yourRetirementAccountsCurrent + partnerRetirementAccountsCurrent
    const nestEgg = nonRetirementAssetsCurrent + retirementAccountsCurrent

    // Step 11: Drawdown rate (pre-tax income / prior year's nest egg, capped at 100%)
    const priorNestEgg = prevNonRetirement + prevYourRetirement + prevPartnerRetirement
    const drawdownRate = priorNestEgg > 0 ? Math.min(1, preTaxRetirementIncome / priorNestEgg) : 0

    rows.push({
      yearNum,
      calendarYear,
      yourAge: currentYourAge,
      partnerAge: currentPartnerAge,
      inflationMultiplier,
      yourSavings: yourContribs.savings,
      partnerSavings: partnerContribs.savings,
      yourRetirementContrib: yourContribs.retirementContrib,
      partnerRetirementContrib: partnerContribs.retirementContrib,
      desiredMonthlyCash,
      preTaxSocialSecurity,
      postTaxIncomeRequired,
      cashAvailableNonRet,
      yourRetirementAccounts: yourRetirementAccountsCurrent,
      partnerRetirementAccounts: partnerRetirementAccountsCurrent,
      cashAvailableRet,
      yourRMD: yourPreTaxRMD,
      yourPostTaxRMD,
      partnerRMD: partnerPreTaxRMD,
      partnerPostTaxRMD,
      totalPostTaxRMD,
      rmdToIncome,
      surplusRMD,
      remainingIncomeNeed,
      amountDeductedNonRet,
      remainingAmountToFund: postTaxStillNeeded,
      additionalRetDeduction,
      yourAdditionalDeduction,
      partnerAdditionalDeduction,
      amountDeductedRet,
      preTaxRetirementIncome,
      nonRetirementAssets: nonRetirementAssetsCurrent,
      retirementAccounts: retirementAccountsCurrent,
      nestEgg,
      drawdownRate,
    })

    // Update for next iteration
    prevNonRetirement = nonRetirementAssetsCurrent
    prevYourRetirement = yourRetirementAccountsCurrent
    prevPartnerRetirement = partnerRetirementAccountsCurrent

    // Stop conditions
    if (currentYourAge >= 125) break
    if (nestEgg <= 0) break
  }

  return rows
}
