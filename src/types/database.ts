export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ============================================================================
// AI SETTINGS: Customizable AI prompt components
// ============================================================================
export type AISettingKey = 'plan_parser' // Future: 'sequence_suggester', 'treatment_advisor', etc.

export interface AISettingConfig {
  abbreviations: string        // Custom abbreviations list
  custom_treatments: string    // Additional treatments not in taxonomy
  custom_instructions: string  // Extra parsing/processing rules
  // Future fields can be added here without breaking existing data
  [key: string]: string | undefined  // Extensible for future fields
}

// ============================================================================
// FORM OPTIONS SETTINGS: Customizable dropdown/select options
// ============================================================================
export type FormOptionCategory =
  | 'treatment_goals'
  | 'patient_priorities'
  | 'treatments'        // The main treatment taxonomy
  | 'appointment_types'
  | 'delay_reasons'
  | 'medical_conditions'
  | 'allergies'

export interface FormOptionItem {
  id: string
  label: string
  description?: string
  // For treatments - which category they belong to
  treatmentCategory?: TreatmentCategory
  typicalDuration?: number
  requiresLab?: boolean
  // For delays
  typicalWeeks?: number
  // Metadata
  isCustom: boolean  // true = user added, false = system default
  isEnabled: boolean // allows disabling without deleting
}

export interface FormOptionsConfig {
  treatment_goals: FormOptionItem[]
  patient_priorities: FormOptionItem[]
  treatments: FormOptionItem[]         // Full treatment taxonomy
  appointment_types: FormOptionItem[]
  delay_reasons: FormOptionItem[]
  medical_conditions: FormOptionItem[]
  allergies: FormOptionItem[]
}

// ============================================================================
// NEW STRUCTURE: Treatment Plan Item (parsed from AI)
// ============================================================================
export interface TreatmentPlanItem {
  id: string
  raw_text: string                    // Original shorthand: "46 démonter CC + prov"
  teeth: string[]                     // ["46"]
  treatment_type: string | null       // Matched treatment ID or null if custom
  treatment_description: string       // "Dépose couronne + provisoire"
  category: TreatmentCategory         // "restorative"
}

export type TreatmentCategory =
  | 'diagnostic'
  | 'preventive'
  | 'restorative'
  | 'endodontic'
  | 'periodontal'
  | 'surgical'
  | 'implant'
  | 'prosthetic'
  | 'orthodontic'
  | 'other'

export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived'
export type BudgetConstraint = 'no_constraint' | 'moderate' | 'limited' | 'very_limited'
export type TimeConstraint = 'no_constraint' | 'moderate' | 'urgent' | 'very_urgent'
export type PatientPriority = 'function' | 'aesthetics' | 'cost' | 'time' | 'durability' | 'minimal_intervention'
export type DentalAnxiety = 'none' | 'mild' | 'moderate' | 'severe'
export type AgeRange = '18-30' | '31-45' | '46-60' | '61-75' | '75+'
export type Sex = 'male' | 'female' | 'other'

export type Database = {
  public: {
    Tables: {
      dentists: {
        Row: {
          id: string
          email: string
          full_name: string
          title: string | null
          institution: string | null
          department: string | null
          years_experience: number | null
          specializations: string[] | null
          orcid_id: string | null
          consent_research: boolean
          consent_data_processing: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
          auth_user_id: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          title?: string | null
          institution?: string | null
          department?: string | null
          years_experience?: number | null
          specializations?: string[] | null
          orcid_id?: string | null
          consent_research?: boolean
          consent_data_processing?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          auth_user_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          title?: string | null
          institution?: string | null
          department?: string | null
          years_experience?: number | null
          specializations?: string[] | null
          orcid_id?: string | null
          consent_research?: boolean
          consent_data_processing?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          auth_user_id?: string | null
        }
      }
      // ============================================================================
      // NEW: treatment_plans (lightweight, AI-parsed)
      // ============================================================================
      treatment_plans: {
        Row: {
          id: string
          created_by: string | null
          last_modified_by: string | null
          plan_number: string | null
          title: string | null
          raw_input: string
          treatment_items: TreatmentPlanItem[]
          dentistry_types: TreatmentCategory[]
          teeth_involved: string[]
          ai_parsed: boolean
          ai_parsing_confidence: number | null
          user_confirmed: boolean
          notes: string | null
          status: PlanStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by?: string | null
          last_modified_by?: string | null
          plan_number?: string | null
          title?: string | null
          raw_input: string
          treatment_items?: TreatmentPlanItem[]
          dentistry_types?: TreatmentCategory[]
          teeth_involved?: string[]
          ai_parsed?: boolean
          ai_parsing_confidence?: number | null
          user_confirmed?: boolean
          notes?: string | null
          status?: PlanStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string | null
          last_modified_by?: string | null
          plan_number?: string | null
          title?: string | null
          raw_input?: string
          treatment_items?: TreatmentPlanItem[]
          dentistry_types?: TreatmentCategory[]
          teeth_involved?: string[]
          ai_parsed?: boolean
          ai_parsing_confidence?: number | null
          user_confirmed?: boolean
          notes?: string | null
          status?: PlanStatus
          created_at?: string
          updated_at?: string
        }
      }
      // ============================================================================
      // UPDATED: treatment_sequences (now with patient context)
      // ============================================================================
      treatment_sequences: {
        Row: {
          id: string
          plan_id: string | null  // NEW: links to treatment_plans
          case_id: string | null  // DEPRECATED: kept for backward compat
          created_by: string | null
          last_modified_by: string | null
          sequence_number: string | null
          title: string | null
          overall_strategy: string | null
          treatment_goals: string[] | null
          constraints_considered: Json
          alternatives_considered: Json
          expected_prognosis: Database['public']['Enums']['prognosis'] | null
          expected_duration_months: number | null
          success_criteria: string | null
          status: Database['public']['Enums']['sequence_status']
          submitted_at: string | null
          created_at: string
          updated_at: string
          // NEW: Patient context fields
          patient_age_range: AgeRange | null
          patient_sex: Sex | null
          budget_constraint: BudgetConstraint | null
          time_constraint: TimeConstraint | null
          time_constraint_details: string | null
          patient_priorities: PatientPriority[] | null
          dental_anxiety: DentalAnxiety | null
          additional_context: string | null
        }
        Insert: {
          id?: string
          plan_id?: string | null
          case_id?: string | null
          created_by?: string | null
          last_modified_by?: string | null
          sequence_number?: string | null
          title?: string | null
          overall_strategy?: string | null
          treatment_goals?: string[] | null
          constraints_considered?: Json
          alternatives_considered?: Json
          expected_prognosis?: Database['public']['Enums']['prognosis'] | null
          expected_duration_months?: number | null
          success_criteria?: string | null
          status?: Database['public']['Enums']['sequence_status']
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
          patient_age_range?: AgeRange | null
          patient_sex?: Sex | null
          budget_constraint?: BudgetConstraint | null
          time_constraint?: TimeConstraint | null
          time_constraint_details?: string | null
          patient_priorities?: PatientPriority[] | null
          dental_anxiety?: DentalAnxiety | null
          additional_context?: string | null
        }
        Update: {
          id?: string
          plan_id?: string | null
          case_id?: string | null
          created_by?: string | null
          last_modified_by?: string | null
          sequence_number?: string | null
          title?: string | null
          overall_strategy?: string | null
          treatment_goals?: string[] | null
          constraints_considered?: Json
          alternatives_considered?: Json
          expected_prognosis?: Database['public']['Enums']['prognosis'] | null
          expected_duration_months?: number | null
          success_criteria?: string | null
          status?: Database['public']['Enums']['sequence_status']
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
          patient_age_range?: AgeRange | null
          patient_sex?: Sex | null
          budget_constraint?: BudgetConstraint | null
          time_constraint?: TimeConstraint | null
          time_constraint_details?: string | null
          patient_priorities?: PatientPriority[] | null
          dental_anxiety?: DentalAnxiety | null
          additional_context?: string | null
        }
      }
      // Keep old clinical_cases for backward compatibility (deprecated)
      clinical_cases: {
        Row: {
          id: string
          created_by: string | null
          last_modified_by: string | null
          case_number: string | null
          title: string
          patient_age_range: Database['public']['Enums']['age_range'] | null
          patient_sex: Database['public']['Enums']['sex'] | null
          patient_general_health: Database['public']['Enums']['general_health'] | null
          medical_history: Json
          chief_complaint: string
          chief_complaint_symptoms: string[] | null
          chief_complaint_location: string[] | null
          chief_complaint_duration: string | null
          chief_complaint_severity: Database['public']['Enums']['severity'] | null
          dental_findings: Json
          missing_teeth: string[]
          radiographic_findings: string | null
          perio_diagnosis: string | null
          perio_stage: Database['public']['Enums']['perio_stage'] | null
          perio_grade: Database['public']['Enums']['perio_grade'] | null
          perio_stability: Database['public']['Enums']['perio_stability'] | null
          occlusion_classification: string | null
          occlusion_issues: string[] | null
          patient_oral_hygiene: Database['public']['Enums']['oral_hygiene'] | null
          patient_compliance: Database['public']['Enums']['compliance'] | null
          patient_anxiety: Database['public']['Enums']['anxiety_level'] | null
          patient_aesthetic_priority: Database['public']['Enums']['priority_level'] | null
          patient_has_financial_constraints: boolean
          patient_has_time_constraints: boolean
          complexity: Database['public']['Enums']['complexity'] | null
          additional_notes: string | null
          status: Database['public']['Enums']['case_status']
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by?: string | null
          last_modified_by?: string | null
          case_number?: string | null
          title: string
          patient_age_range?: Database['public']['Enums']['age_range'] | null
          patient_sex?: Database['public']['Enums']['sex'] | null
          patient_general_health?: Database['public']['Enums']['general_health'] | null
          medical_history?: Json
          chief_complaint: string
          chief_complaint_symptoms?: string[] | null
          chief_complaint_location?: string[] | null
          chief_complaint_duration?: string | null
          chief_complaint_severity?: Database['public']['Enums']['severity'] | null
          dental_findings?: Json
          missing_teeth?: string[]
          radiographic_findings?: string | null
          perio_diagnosis?: string | null
          perio_stage?: Database['public']['Enums']['perio_stage'] | null
          perio_grade?: Database['public']['Enums']['perio_grade'] | null
          perio_stability?: Database['public']['Enums']['perio_stability'] | null
          occlusion_classification?: string | null
          occlusion_issues?: string[] | null
          patient_oral_hygiene?: Database['public']['Enums']['oral_hygiene'] | null
          patient_compliance?: Database['public']['Enums']['compliance'] | null
          patient_anxiety?: Database['public']['Enums']['anxiety_level'] | null
          patient_aesthetic_priority?: Database['public']['Enums']['priority_level'] | null
          patient_has_financial_constraints?: boolean
          patient_has_time_constraints?: boolean
          complexity?: Database['public']['Enums']['complexity'] | null
          additional_notes?: string | null
          status?: Database['public']['Enums']['case_status']
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string | null
          last_modified_by?: string | null
          case_number?: string | null
          title?: string
          patient_age_range?: Database['public']['Enums']['age_range'] | null
          patient_sex?: Database['public']['Enums']['sex'] | null
          patient_general_health?: Database['public']['Enums']['general_health'] | null
          medical_history?: Json
          chief_complaint?: string
          chief_complaint_symptoms?: string[] | null
          chief_complaint_location?: string[] | null
          chief_complaint_duration?: string | null
          chief_complaint_severity?: Database['public']['Enums']['severity'] | null
          dental_findings?: Json
          missing_teeth?: string[]
          radiographic_findings?: string | null
          perio_diagnosis?: string | null
          perio_stage?: Database['public']['Enums']['perio_stage'] | null
          perio_grade?: Database['public']['Enums']['perio_grade'] | null
          perio_stability?: Database['public']['Enums']['perio_stability'] | null
          occlusion_classification?: string | null
          occlusion_issues?: string[] | null
          patient_oral_hygiene?: Database['public']['Enums']['oral_hygiene'] | null
          patient_compliance?: Database['public']['Enums']['compliance'] | null
          patient_anxiety?: Database['public']['Enums']['anxiety_level'] | null
          patient_aesthetic_priority?: Database['public']['Enums']['priority_level'] | null
          patient_has_financial_constraints?: boolean
          patient_has_time_constraints?: boolean
          complexity?: Database['public']['Enums']['complexity'] | null
          additional_notes?: string | null
          status?: Database['public']['Enums']['case_status']
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointment_groups: {
        Row: {
          id: string
          sequence_id: string
          position: number
          title: string | null
          appointment_type: Database['public']['Enums']['appointment_type']
          estimated_duration_minutes: number | null
          delay_value: number | null
          delay_unit: Database['public']['Enums']['delay_unit'] | null
          delay_is_flexible: boolean
          delay_min: number | null
          delay_max: number | null
          delay_rationale: string | null
          objectives: string[] | null
          prerequisites: string[] | null
          clinical_notes: string | null
          patient_instructions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sequence_id: string
          position: number
          title?: string | null
          appointment_type?: Database['public']['Enums']['appointment_type']
          estimated_duration_minutes?: number | null
          delay_value?: number | null
          delay_unit?: Database['public']['Enums']['delay_unit'] | null
          delay_is_flexible?: boolean
          delay_min?: number | null
          delay_max?: number | null
          delay_rationale?: string | null
          objectives?: string[] | null
          prerequisites?: string[] | null
          clinical_notes?: string | null
          patient_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sequence_id?: string
          position?: number
          title?: string | null
          appointment_type?: Database['public']['Enums']['appointment_type']
          estimated_duration_minutes?: number | null
          delay_value?: number | null
          delay_unit?: Database['public']['Enums']['delay_unit'] | null
          delay_is_flexible?: boolean
          delay_min?: number | null
          delay_max?: number | null
          delay_rationale?: string | null
          objectives?: string[] | null
          prerequisites?: string[] | null
          clinical_notes?: string | null
          patient_instructions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      treatments: {
        Row: {
          id: string
          appointment_group_id: string
          position: number
          treatment_type: string
          treatment_category: Database['public']['Enums']['treatment_category']
          custom_name: string | null
          ada_code: string | null
          teeth: string[]
          surfaces: string[] | null
          material: string | null
          technique: string | null
          specifications: string | null
          rationale_treatment: string | null
          rationale_timing: string | null
          rationale_teeth: string | null
          evidence_references: string[] | null
          confidence: Database['public']['Enums']['confidence_level']
          contingency_condition: string | null
          contingency_action: string | null
          estimated_duration_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_group_id: string
          position: number
          treatment_type: string
          treatment_category: Database['public']['Enums']['treatment_category']
          custom_name?: string | null
          ada_code?: string | null
          teeth: string[]
          surfaces?: string[] | null
          material?: string | null
          technique?: string | null
          specifications?: string | null
          rationale_treatment?: string | null
          rationale_timing?: string | null
          rationale_teeth?: string | null
          evidence_references?: string[] | null
          confidence?: Database['public']['Enums']['confidence_level']
          contingency_condition?: string | null
          contingency_action?: string | null
          estimated_duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_group_id?: string
          position?: number
          treatment_type?: string
          treatment_category?: Database['public']['Enums']['treatment_category']
          custom_name?: string | null
          ada_code?: string | null
          teeth?: string[]
          surfaces?: string[] | null
          material?: string | null
          technique?: string | null
          specifications?: string | null
          rationale_treatment?: string | null
          rationale_timing?: string | null
          rationale_teeth?: string | null
          evidence_references?: string[] | null
          confidence?: Database['public']['Enums']['confidence_level']
          contingency_condition?: string | null
          contingency_action?: string | null
          estimated_duration_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      sequence_evaluations: {
        Row: {
          id: string
          sequence_id: string
          evaluator_id: string | null
          score_clinical_validity: number | null
          score_completeness: number | null
          score_sequencing: number | null
          score_feasibility: number | null
          score_overall: number | null
          strengths: string | null
          weaknesses: string | null
          suggestions: string | null
          general_comments: string | null
          recommendation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sequence_id: string
          evaluator_id?: string | null
          score_clinical_validity?: number | null
          score_completeness?: number | null
          score_sequencing?: number | null
          score_feasibility?: number | null
          score_overall?: number | null
          strengths?: string | null
          weaknesses?: string | null
          suggestions?: string | null
          general_comments?: string | null
          recommendation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sequence_id?: string
          evaluator_id?: string | null
          score_clinical_validity?: number | null
          score_completeness?: number | null
          score_sequencing?: number | null
          score_feasibility?: number | null
          score_overall?: number | null
          strengths?: string | null
          weaknesses?: string | null
          suggestions?: string | null
          general_comments?: string | null
          recommendation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          dentist_id: string | null
          dentist_name: string | null
          action: string
          entity_type: string
          entity_id: string
          changes: Json | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          dentist_id?: string | null
          dentist_name?: string | null
          action: string
          entity_type: string
          entity_id: string
          changes?: Json | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          dentist_id?: string | null
          dentist_name?: string | null
          action?: string
          entity_type?: string
          entity_id?: string
          changes?: Json | null
          metadata?: Json | null
          created_at?: string
        }
      }
      // ============================================================================
      // AI SETTINGS: Configurable AI prompt components
      // ============================================================================
      ai_settings: {
        Row: {
          id: string
          setting_key: AISettingKey      // 'plan_parser', future: 'sequence_suggester', etc.
          config: AISettingConfig        // JSON with abbreviations, custom_treatments, etc.
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: AISettingKey
          config: AISettingConfig
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: AISettingKey
          config?: AISettingConfig
          updated_at?: string
          updated_by?: string | null
        }
      }
      // ============================================================================
      // FORM OPTIONS: Customizable dropdown/select options
      // ============================================================================
      form_options: {
        Row: {
          id: string
          config: FormOptionsConfig      // JSON with all customizable options
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          config: FormOptionsConfig
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          config?: FormOptionsConfig
          updated_at?: string
          updated_by?: string | null
        }
      }
    }
    Views: {
      plan_overview: {
        Row: {
          id: string | null
          plan_number: string | null
          title: string | null
          raw_input: string | null
          dentistry_types: TreatmentCategory[] | null
          teeth_involved: string[] | null
          status: PlanStatus | null
          ai_parsed: boolean | null
          user_confirmed: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by_name: string | null
          sequence_count: number | null
          approved_sequence_count: number | null
        }
      }
      sequence_overview: {
        Row: {
          id: string | null
          sequence_number: string | null
          title: string | null
          status: Database['public']['Enums']['sequence_status'] | null
          plan_id: string | null
          plan_number: string | null
          plan_title: string | null
          plan_raw_input: string | null
          patient_age_range: AgeRange | null
          patient_sex: Sex | null
          budget_constraint: BudgetConstraint | null
          time_constraint: TimeConstraint | null
          patient_priorities: PatientPriority[] | null
          dental_anxiety: DentalAnxiety | null
          created_at: string | null
          updated_at: string | null
          created_by_name: string | null
          appointment_count: number | null
          treatment_count: number | null
          evaluation_count: number | null
          avg_score: number | null
        }
      }
      // Keep old view for backward compat
      case_overview: {
        Row: {
          id: string | null
          case_number: string | null
          title: string | null
          status: Database['public']['Enums']['case_status'] | null
          complexity: Database['public']['Enums']['complexity'] | null
          created_at: string | null
          updated_at: string | null
          created_by_name: string | null
          last_modified_by_name: string | null
          sequence_count: number | null
          unique_contributors: number | null
          total_evaluations: number | null
          avg_score: number | null
        }
      }
    }
    Enums: {
      age_range: '18-30' | '31-45' | '46-60' | '61-75' | '75+'
      sex: 'male' | 'female' | 'other'
      general_health: 'healthy' | 'compromised' | 'severely_compromised'
      asa_classification: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI'
      severity: 'mild' | 'moderate' | 'severe'
      prognosis: 'excellent' | 'good' | 'fair' | 'questionable' | 'hopeless'
      mobility_grade: '0' | '1' | '2' | '3'
      furcation_grade: '0' | 'I' | 'II' | 'III'
      oral_hygiene: 'excellent' | 'good' | 'fair' | 'poor'
      compliance: 'high' | 'moderate' | 'low'
      anxiety_level: 'none' | 'mild' | 'moderate' | 'severe'
      priority_level: 'low' | 'moderate' | 'high'
      complexity: 'simple' | 'moderate' | 'complex' | 'highly_complex'
      perio_stage: 'I' | 'II' | 'III' | 'IV'
      perio_grade: 'A' | 'B' | 'C'
      perio_stability: 'stable' | 'unstable'
      treatment_category:
        | 'diagnostic'
        | 'preventive'
        | 'restorative'
        | 'endodontic'
        | 'periodontal'
        | 'surgical'
        | 'implant'
        | 'prosthetic'
        | 'orthodontic'
        | 'other'
      appointment_type: 'emergency' | 'diagnostic' | 'treatment' | 'review' | 'maintenance'
      delay_unit: 'days' | 'weeks' | 'months'
      confidence_level: 'high' | 'moderate' | 'low'
      case_status: 'draft' | 'published' | 'archived'
      plan_status: 'draft' | 'active' | 'completed' | 'archived'
      budget_constraint: 'no_constraint' | 'moderate' | 'limited' | 'very_limited'
      time_constraint: 'no_constraint' | 'moderate' | 'urgent' | 'very_urgent'
      patient_priority: 'function' | 'aesthetics' | 'cost' | 'time' | 'durability' | 'minimal_intervention'
      dental_anxiety: 'none' | 'mild' | 'moderate' | 'severe'
      sequence_status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'needs_revision'
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']

// Convenience exports - NEW STRUCTURE
export type Dentist = Tables<'dentists'>
export type TreatmentPlan = Tables<'treatment_plans'>
export type TreatmentSequence = Tables<'treatment_sequences'>
export type AppointmentGroup = Tables<'appointment_groups'>
export type Treatment = Tables<'treatments'>
export type SequenceEvaluation = Tables<'sequence_evaluations'>
export type ActivityLog = Tables<'activity_log'>
export type AISetting = Tables<'ai_settings'>
export type FormOptions = Tables<'form_options'>

export type PlanOverview = Views<'plan_overview'>
export type SequenceOverview = Views<'sequence_overview'>

// DEPRECATED - Keep for backward compatibility
export type ClinicalCase = Tables<'clinical_cases'>
export type CaseOverview = Views<'case_overview'>
