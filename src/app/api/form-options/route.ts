import { createClient } from '@/lib/supabase/server'
import { getDefaultFormOptions, mergeWithDefaults } from '@/lib/constants/form-options-defaults'
import type { FormOptionsConfig } from '@/types/database'

/**
 * GET /api/form-options
 * Fetch form options (merged with defaults)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch options from database
    const { data, error } = await supabase
      .from('form_options')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      // If not found, return defaults
      if (error.code === 'PGRST116') {
        return Response.json({
          config: getDefaultFormOptions(),
          is_default: true,
        })
      }
      console.error('Error fetching form options:', error)
      return Response.json({ error: 'Failed to fetch options' }, { status: 500 })
    }

    // Merge with defaults to ensure new default options are included
    const mergedConfig = mergeWithDefaults(data.config as Partial<FormOptionsConfig>)

    return Response.json({
      config: mergedConfig,
      updated_at: data.updated_at,
      is_default: false,
    })
  } catch (error) {
    console.error('Error in GET /api/form-options:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/form-options
 * Save form options
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { config } = body as { config: FormOptionsConfig }

    if (!config) {
      return Response.json({ error: 'Missing config' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get dentist ID if user is authenticated
    let dentistId: string | null = null
    if (user) {
      const { data: dentist } = await supabase
        .from('dentists')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      dentistId = dentist?.id || null
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('form_options')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing) {
      // Update existing
      result = await supabase
        .from('form_options')
        .update({
          config,
          updated_by: dentistId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from('form_options')
        .insert({
          config,
          updated_by: dentistId,
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving form options:', result.error)
      return Response.json({ error: 'Failed to save options' }, { status: 500 })
    }

    return Response.json({
      success: true,
      config: result.data.config,
      updated_at: result.data.updated_at,
    })
  } catch (error) {
    console.error('Error in POST /api/form-options:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
