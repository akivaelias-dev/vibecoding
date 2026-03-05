import { useState, useMemo, useEffect } from 'react'
import type { AppState, ProjectionRow } from '../types.ts'
import { generateProjections } from '../calculations.ts'
import { STORAGE_KEY, loadSaved } from '../constants.ts'

/** Data for a single scenario (base, pessimistic, or optimistic) */
export interface ScenarioData {
  projections: ProjectionRow[]
  atRetirement: number
  isDepleted: boolean
  lastRow: ProjectionRow | null
  investmentReturn: number
  cola: number
}

const saved = loadSaved()

/**
 * Central state hook for the retirement calculator.
 * Manages all form inputs, localStorage persistence, and derived projections.
 */
export function useAppState() {
  // ===== Assets =====
  const [nonRetirementAssets, setNonRetirementAssets] = useState(saved.nonRetirementAssets)
  const [realEstateAssets, setRealEstateAssets] = useState(saved.realEstateAssets)

  // ===== Your Info =====
  const [yourAge, setYourAge] = useState(saved.yourAge)
  const [yourRetirementAge, setYourRetirementAge] = useState(saved.yourRetirementAge)
  const [yourBrokerageContribution, setYourBrokerageContribution] = useState(saved.yourBrokerageContribution)
  const [yourRetirementContribution, setYourRetirementContribution] = useState(saved.yourRetirementContribution)
  const [yourRetirementAssets, setYourRetirementAssets] = useState(saved.yourRetirementAssets)
  const [yourSocialSecurity, setYourSocialSecurity] = useState(saved.yourSocialSecurity)
  const [yourSSStartAge, setYourSSStartAge] = useState(saved.yourSSStartAge)

  // ===== Partner Info =====
  const [showPartner, setShowPartner] = useState(saved.showPartner)
  const [partnerAge, setPartnerAge] = useState(saved.partnerAge)
  const [partnerRetirementAge, setPartnerRetirementAge] = useState(saved.partnerRetirementAge)
  const [partnerBrokerageContribution, setPartnerBrokerageContribution] = useState(saved.partnerBrokerageContribution)
  const [partnerRetirementContribution, setPartnerRetirementContribution] = useState(saved.partnerRetirementContribution)
  const [partnerRetirementAssets, setPartnerRetirementAssets] = useState(saved.partnerRetirementAssets)
  const [partnerSocialSecurity, setPartnerSocialSecurity] = useState(saved.partnerSocialSecurity)
  const [partnerSSStartAge, setPartnerSSStartAge] = useState(saved.partnerSSStartAge)

  // ===== Retirement Goals =====
  const [monthlyRetirementCash, setMonthlyRetirementCash] = useState(saved.monthlyRetirementCash)
  const [monthlyPartialRetirementCash, setMonthlyPartialRetirementCash] = useState(saved.monthlyPartialRetirementCash)

  // ===== Assumptions =====
  const [cola, setCola] = useState(saved.cola)
  const [investmentReturn, setInvestmentReturn] = useState(saved.investmentReturn)
  const [brokerageTaxRate, setBrokerageTaxRate] = useState(saved.brokerageTaxRate)
  const [federalTaxRate, setFederalTaxRate] = useState(saved.federalTaxRate)
  const [stateTaxRate, setStateTaxRate] = useState(saved.stateTaxRate)

  const resetAssumptions = () => {
    setCola(0.028)
    setInvestmentReturn(0.08)
    setBrokerageTaxRate(0.25)
    setFederalTaxRate(0.37)
    setStateTaxRate(0.133)
  }

  // ===== Persist to localStorage =====
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nonRetirementAssets, yourRetirementAssets, partnerRetirementAssets, realEstateAssets,
      yourAge, yourRetirementAge, yourBrokerageContribution, yourRetirementContribution,
      yourSocialSecurity, yourSSStartAge,
      showPartner, partnerAge, partnerRetirementAge, partnerBrokerageContribution,
      partnerRetirementContribution, partnerSocialSecurity, partnerSSStartAge,
      monthlyRetirementCash, monthlyPartialRetirementCash,
      cola, investmentReturn, brokerageTaxRate, federalTaxRate, stateTaxRate,
    }))
  }, [
    nonRetirementAssets, yourRetirementAssets, partnerRetirementAssets, realEstateAssets,
    yourAge, yourRetirementAge, yourBrokerageContribution, yourRetirementContribution,
    yourSocialSecurity, yourSSStartAge,
    showPartner, partnerAge, partnerRetirementAge, partnerBrokerageContribution,
    partnerRetirementContribution, partnerSocialSecurity, partnerSSStartAge,
    monthlyRetirementCash, monthlyPartialRetirementCash,
    cola, investmentReturn, brokerageTaxRate, federalTaxRate, stateTaxRate,
  ])

  // ===== Build AppState (zeroes out partner fields when partner is hidden) =====
  const state: AppState = useMemo(() => ({
    nonRetirementAssets, yourRetirementAssets, realEstateAssets,
    partnerRetirementAssets: showPartner ? partnerRetirementAssets : 0,
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
  }), [
    nonRetirementAssets, yourRetirementAssets, partnerRetirementAssets, realEstateAssets,
    yourAge, yourRetirementAge, yourBrokerageContribution, yourRetirementContribution,
    yourSocialSecurity, yourSSStartAge,
    showPartner, partnerAge, partnerRetirementAge, partnerBrokerageContribution,
    partnerRetirementContribution, partnerSocialSecurity, partnerSSStartAge,
    monthlyRetirementCash, monthlyPartialRetirementCash,
    cola, investmentReturn, brokerageTaxRate, federalTaxRate, stateTaxRate,
  ])

  // ===== Projections =====
  const projections = useMemo(() => generateProjections(state), [state])

  const pessReturn = Math.max(0, investmentReturn - 0.02)
  const pessCola = cola + 0.01
  const pessimisticProjections = useMemo(() => generateProjections({
    ...state, investmentReturn: pessReturn, cola: pessCola,
  }), [state, pessReturn, pessCola])

  const optReturn = investmentReturn + 0.02
  const optCola = cola >= 0.02 ? cola - 0.01 : cola / 2
  const optimisticProjections = useMemo(() => generateProjections({
    ...state, investmentReturn: optReturn, cola: optCola,
  }), [state, optReturn, optCola])

  // ===== Scenario Data Helpers =====
  // Finds the first row where someone just retired (age = retirementAge + 1)
  const findRetirementRow = (rows: ProjectionRow[]) =>
    rows.find(r => r.yourAge === yourRetirementAge + 1 || (showPartner && r.partnerAge === partnerRetirementAge + 1))

  const makeScenarioData = (rows: ProjectionRow[], ir: number, c: number): ScenarioData => {
    const retRow = findRetirementRow(rows)
    const lastRow = rows.length > 0 ? rows[rows.length - 1] : null
    return {
      projections: rows,
      atRetirement: retRow?.nestEgg || rows[0]?.nestEgg || 0,
      isDepleted: lastRow !== null && lastRow.nestEgg <= 0,
      lastRow,
      investmentReturn: ir,
      cola: c,
    }
  }

  return {
    // Assets
    nonRetirementAssets, setNonRetirementAssets,
    realEstateAssets, setRealEstateAssets,

    // Your info
    yourAge, setYourAge,
    yourRetirementAge, setYourRetirementAge,
    yourBrokerageContribution, setYourBrokerageContribution,
    yourRetirementContribution, setYourRetirementContribution,
    yourRetirementAssets, setYourRetirementAssets,
    yourSocialSecurity, setYourSocialSecurity,
    yourSSStartAge, setYourSSStartAge,

    // Partner info
    showPartner, setShowPartner,
    partnerAge, setPartnerAge,
    partnerRetirementAge, setPartnerRetirementAge,
    partnerBrokerageContribution, setPartnerBrokerageContribution,
    partnerRetirementContribution, setPartnerRetirementContribution,
    partnerRetirementAssets, setPartnerRetirementAssets,
    partnerSocialSecurity, setPartnerSocialSecurity,
    partnerSSStartAge, setPartnerSSStartAge,

    // Retirement goals
    monthlyRetirementCash, setMonthlyRetirementCash,
    monthlyPartialRetirementCash, setMonthlyPartialRetirementCash,

    // Assumptions
    cola, setCola,
    investmentReturn, setInvestmentReturn,
    brokerageTaxRate, setBrokerageTaxRate,
    federalTaxRate, setFederalTaxRate,
    stateTaxRate, setStateTaxRate,
    resetAssumptions,

    // Computed
    state,
    projections,
    baseScenario: makeScenarioData(projections, investmentReturn, cola),
    pessimisticScenario: makeScenarioData(pessimisticProjections, pessReturn, pessCola),
    optimisticScenario: makeScenarioData(optimisticProjections, optReturn, optCola),
  }
}
