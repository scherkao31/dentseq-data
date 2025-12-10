'use client'

import { useState, useEffect } from 'react'
import { getDefaultFormOptions, getEnabledOptions } from '@/lib/constants/form-options-defaults'
import type { FormOptionsConfig, FormOptionItem } from '@/types/database'

interface UseFormOptionsReturn {
  options: FormOptionsConfig
  isLoading: boolean
  error: string | null
  // Convenience getters for enabled options only
  treatmentGoals: FormOptionItem[]
  patientPriorities: FormOptionItem[]
  treatments: FormOptionItem[]
  appointmentTypes: FormOptionItem[]
  delayReasons: FormOptionItem[]
  medicalConditions: FormOptionItem[]
  allergies: FormOptionItem[]
}

/**
 * Hook to fetch and use form options
 * Returns only enabled options for use in forms
 */
export function useFormOptions(): UseFormOptionsReturn {
  const [options, setOptions] = useState<FormOptionsConfig>(getDefaultFormOptions())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch('/api/form-options')
        if (res.ok) {
          const data = await res.json()
          setOptions(data.config)
        } else {
          // Use defaults if fetch fails
          setOptions(getDefaultFormOptions())
        }
      } catch (err) {
        console.error('Error fetching form options:', err)
        setError('Failed to load form options')
        setOptions(getDefaultFormOptions())
      } finally {
        setIsLoading(false)
      }
    }
    fetchOptions()
  }, [])

  return {
    options,
    isLoading,
    error,
    // Only return enabled options
    treatmentGoals: getEnabledOptions(options.treatment_goals),
    patientPriorities: getEnabledOptions(options.patient_priorities),
    treatments: getEnabledOptions(options.treatments),
    appointmentTypes: getEnabledOptions(options.appointment_types),
    delayReasons: getEnabledOptions(options.delay_reasons),
    medicalConditions: getEnabledOptions(options.medical_conditions),
    allergies: getEnabledOptions(options.allergies),
  }
}
