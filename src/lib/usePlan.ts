import { useState, useCallback } from 'react'

export type PlanMap = Record<string, number>  // ISO date → fishFry location id
const LS_KEY = 'fish-fry-plan'

function loadPlan(): PlanMap {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as PlanMap
  } catch {
    return {}
  }
}

function savePlan(plan: PlanMap) {
  localStorage.setItem(LS_KEY, JSON.stringify(plan))
}

export function usePlan() {
  const [plan, setPlan] = useState<PlanMap>(loadPlan)

  const setPlanEntry = useCallback((date: string, fishFryId: number) => {
    setPlan(prev => {
      const next = { ...prev, [date]: fishFryId }
      savePlan(next)
      return next
    })
  }, [])

  const removePlanEntry = useCallback((date: string) => {
    setPlan(prev => {
      const next = { ...prev }
      delete next[date]
      savePlan(next)
      return next
    })
  }, [])

  const clearPlan = useCallback(() => {
    setPlan({})
    savePlan({})
  }, [])

  const importPlan = useCallback((newPlan: PlanMap) => {
    setPlan(newPlan)
    savePlan(newPlan)
  }, [])

  return { plan, setPlanEntry, removePlanEntry, clearPlan, importPlan }
}
