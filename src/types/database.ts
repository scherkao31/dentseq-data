export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
      treatment_sequences: {
        Row: {
          id: string
          case_id: string
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
        }
        Insert: {
          id?: string
          case_id: string
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
        }
        Update: {
          id?: string
          case_id?: string
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
    }
    Views: {
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
      sequence_overview: {
        Row: {
          id: string | null
          sequence_number: string | null
          title: string | null
          status: Database['public']['Enums']['sequence_status'] | null
          case_id: string | null
          case_number: string | null
          case_title: string | null
          created_at: string | null
          updated_at: string | null
          created_by_name: string | null
          last_modified_by_name: string | null
          appointment_count: number | null
          treatment_count: number | null
          evaluation_count: number | null
          avg_score: number | null
          avg_clinical_validity: number | null
          avg_completeness: number | null
          avg_sequencing: number | null
          avg_feasibility: number | null
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

// Convenience exports
export type Dentist = Tables<'dentists'>
export type ClinicalCase = Tables<'clinical_cases'>
export type TreatmentSequence = Tables<'treatment_sequences'>
export type AppointmentGroup = Tables<'appointment_groups'>
export type Treatment = Tables<'treatments'>
export type SequenceEvaluation = Tables<'sequence_evaluations'>
export type ActivityLog = Tables<'activity_log'>

export type CaseOverview = Views<'case_overview'>
export type SequenceOverview = Views<'sequence_overview'>
