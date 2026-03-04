/** Input state for the retirement projection model */
export interface AppState {
  // Assets
  nonRetirementAssets: number
  yourRetirementAssets: number
  partnerRetirementAssets: number
  realEstateAssets: number

  // Your info
  yourAge: number
  yourRetirementAge: number
  yourBrokerageContribution: number
  yourRetirementContribution: number
  yourSocialSecurity: number
  yourSSStartAge: number

  // Partner info (partnerAge = 0 means no partner)
  partnerAge: number
  partnerRetirementAge: number
  partnerBrokerageContribution: number
  partnerRetirementContribution: number
  partnerSocialSecurity: number
  partnerSSStartAge: number

  // Retirement goals
  monthlyRetirementCash: number
  monthlyPartialRetirementCash: number

  // Assumptions
  cola: number
  investmentReturn: number
  brokerageTaxRate: number
  federalTaxRate: number
  stateTaxRate: number
}

/** A single row in the year-by-year projection table */
export interface ProjectionRow {
  yearNum: number                      // A: Year number (1, 2, 3...)
  calendarYear: number                 // B: Calendar Year
  yourAge: number                      // C: My Age
  partnerAge: number                   // D: Partner Age
  inflationMultiplier: number          // H: Inflation multiplier (1+COLA)^year
  yourSavings: number                  // E: My Savings while Working
  partnerSavings: number               // F: Partner's Savings while Working
  yourRetirementContrib: number        // G: My Retirement Account Contribution
  partnerRetirementContrib: number     // H: Partner's Retirement Account Contribution
  desiredMonthlyCash: number           // I: Desired Monthly Cash when Retired
  preTaxSocialSecurity: number         // J: Pre-tax Annual Social Security Benefit
  postTaxIncomeRequired: number        // K: Post-tax Annual Retirement Income Required
  cashAvailableNonRet: number          // L: Cash Available from Non-retirement Assets
  yourRetirementAccounts: number       // M: My Retirement Accounts balance
  partnerRetirementAccounts: number    // N: Partner's Retirement Accounts balance
  cashAvailableRet: number             // O: Cash Available from Retirement Accounts (combined)
  yourRMD: number                      // P: Pre-tax RMD from My Retirement Accounts
  yourPostTaxRMD: number               // Q: My Post-tax RMD
  partnerRMD: number                   // R: Pre-tax RMD from Partner's Retirement Accounts
  partnerPostTaxRMD: number            // S: Partner's Post-tax RMD
  totalPostTaxRMD: number              // T: Total Post-tax RMD (both persons)
  rmdToIncome: number                  // U: RMD Contribution to Retirement Income
  surplusRMD: number                   // V: Surplus RMD added to Non-retirement Assets (post-tax)
  remainingIncomeNeed: number          // W: Retirement Income to be Funded on top of RMD
  amountDeductedNonRet: number         // X: Amount Deducted from Non-retirement Assets (pre-tax)
  remainingAmountToFund: number        // Y: Remaining Amount to be Funded (post-tax, after non-ret)
  additionalRetDeduction: number       // Z: Additional Deduction from Retirement Accounts (pre-tax)
  yourAdditionalDeduction: number      // Z: My Portion of Additional Deduction
  partnerAdditionalDeduction: number   // AA: Partner's Portion of Additional Deduction
  amountDeductedRet: number            // Total pre-tax deducted from retirement (RMD + additional)
  preTaxRetirementIncome: number       // AB: Pre-tax income from assets ex-Social Security
  nonRetirementAssets: number          // AC: Non-retirement Assets balance
  retirementAccounts: number           // AD: Total Retirement Accounts (M + N)
  nestEgg: number                      // AE: Total Nest Egg (AC + AD)
  drawdownRate: number                 // AF: Drawdown rate (preTaxRetirementIncome / nestEgg)
}
