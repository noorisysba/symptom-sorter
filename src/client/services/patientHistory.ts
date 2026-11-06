/**
 * Patient Historical Data Service
 *
 * Prepared for future integration to fetch previous medical data:
 * - age
 * - sex
 * - pastMedicalHistory
 * - medications
 * - allergies
 * - investigations
 *
 * Currently defaults to No-Op / Inactive mode so existing system and
 * manual consultation workflow remain 100% unaffected.
 */

export interface HistoricalPatientData {
  age?: string
  sex?: string
  pastMedicalHistory?: string
  medications?: string
  allergies?: string
  investigations?: string
}

export interface PatientHistoryResponse {
  source: 'api' | 'none'
  available: boolean
  data: HistoricalPatientData | null
}

export interface PatientHistoryConfig {
  /** When false (default), no external requests are made and current manual entry remains unchanged */
  enabled: boolean
  /** Base URL or relative endpoint for external patient history API */
  endpointUrl?: string
}

export const defaultPatientHistoryConfig: PatientHistoryConfig = {
  enabled: false, // Default is inactive / no-op as requested
  endpointUrl: '/api/patient-history',
}

class PatientHistoryService {
  private config: PatientHistoryConfig = { ...defaultPatientHistoryConfig }

  public configure(config: Partial<PatientHistoryConfig>): void {
    this.config = { ...this.config, ...config }
  }

  public getConfig(): Readonly<PatientHistoryConfig> {
    return this.config
  }

  /**
   * Fetches historical records for a patient.
   * If config.enabled is false (current state), immediately returns empty/unavailable
   * with zero network overhead and zero disruption to the UI.
   */
  public async fetchPatientHistory(patientId?: string): Promise<PatientHistoryResponse> {
    if (!this.config.enabled) {
      return {
        source: 'none',
        available: false,
        data: null,
      }
    }

    try {
      const url = patientId
        ? `${this.config.endpointUrl}/${encodeURIComponent(patientId)}`
        : (this.config.endpointUrl || '/api/patient-history')

      const res = await fetch(url)
      if (!res.ok) {
        return {
          source: 'api',
          available: false,
          data: null,
        }
      }

      const json = await res.json()
      return {
        source: 'api',
        available: Boolean(json?.data),
        data: json?.data ?? null,
      }
    } catch {
      return {
        source: 'api',
        available: false,
        data: null,
      }
    }
  }
}

export const patientHistoryService = new PatientHistoryService()
