export const STORAGE_KEY = 'retirement-calculator-state'

export const defaults = {
  nonRetirementAssets: 0, yourRetirementAssets: 0, partnerRetirementAssets: 0, realEstateAssets: 0,
  yourAge: 50, yourRetirementAge: 65,
  yourBrokerageContribution: 0, yourRetirementContribution: 0,
  yourSocialSecurity: 0, yourSSStartAge: 70,
  showPartner: true,
  partnerAge: 50, partnerRetirementAge: 65,
  partnerBrokerageContribution: 0, partnerRetirementContribution: 0,
  partnerSocialSecurity: 0, partnerSSStartAge: 70,
  monthlyRetirementCash: 0, monthlyPartialRetirementCash: 0,
  cola: 0.028, investmentReturn: 0.08,
  brokerageTaxRate: 0.25, federalTaxRate: 0.37, stateTaxRate: 0.133,
}

export function loadSaved(): typeof defaults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const loaded = { ...defaults, ...parsed }
      // Migrate old single retirementAssets key to yourRetirementAssets
      if ((parsed as Record<string, unknown>).retirementAssets !== undefined && !parsed.yourRetirementAssets) {
        loaded.yourRetirementAssets = (parsed as Record<string, unknown>).retirementAssets as number
      }
      return loaded
    }
  } catch { /* ignore corrupt data */ }
  return defaults
}
