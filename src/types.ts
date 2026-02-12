/** Input state for the retirement projection model */
export interface AppState {
  // Assets
  nonRetirementAssets: number
  retirementAssets: number
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
  yearNum: number                    // A: Year number (1, 2, 3...)
  calendarYear: number               // B: Calendar Year
  yourAge: number                    // C: My Age
  partnerAge: number                 // D: Partner Age
  yourSavings: number                // E: My Savings while Working
  partnerSavings: number             // F: Partner's Savings while Working
  yourRetirementContrib: number      // G: My Retirement Account Contribution
  partnerRetirementContrib: number   // H: Partner's Retirement Account Contribution
  desiredMonthlyCash: number         // I: Desired Monthly Cash when Retired
  preTaxSocialSecurity: number       // J: Pre-tax Annual Social Security Benefit
  postTaxIncomeRequired: number      // K: Post-tax Annual Retirement Income Required
  cashAvailableNonRet: number        // L: Cash Available from Non-retirement Assets
  cashAvailableRet: number           // M: Cash Available from Retirement Accounts
  amountDeductedNonRet: number       // N: Amount Deducted from Non-retirement Assets
  amountDeductedRet: number          // O: Amount Deducted from Retirement Accounts
  preTaxRetirementIncome: number     // P: Pre-tax Retirement Income (N + O)
  nonRetirementAssets: number        // Q: Non-retirement Assets balance
  retirementAccounts: number         // R: Retirement Accounts balance
  nestEgg: number                    // S: Total Nest Egg (Q + R)
  drawdownRate: number               // T: Drawdown rate (P / S)
}
