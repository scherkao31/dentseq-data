import { createClient } from '@/lib/supabase/server'
import { getDefaultAIConfig } from '@/lib/constants/ai-defaults'
import type { AISettingKey, AISettingConfig } from '@/types/database'

/**
 * GET /api/ai-settings?key=plan_parser
 * Fetch AI settings for a specific feature
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key') as AISettingKey

    if (!key) {
      return Response.json({ error: 'Missing setting_key parameter' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch settings from database
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('setting_key', key)
      .single()

    if (error) {
      // If not found, return defaults
      if (error.code === 'PGRST116') {
        return Response.json({
          setting_key: key,
          config: getDefaultAIConfig(key),
          is_default: true,
        })
      }
      console.error('Error fetching AI settings:', error)
      return Response.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return Response.json({
      setting_key: data.setting_key,
      config: data.config as AISettingConfig,
      updated_at: data.updated_at,
      is_default: false,
    })
  } catch (error) {
    console.error('Error in GET /api/ai-settings:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/ai-settings
 * Save AI settings for a specific feature
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { setting_key, config } = body as {
      setting_key: AISettingKey
      config: AISettingConfig
    }

    if (!setting_key || !config) {
      return Response.json(
        { error: 'Missing setting_key or config' },
        { status: 400 }
      )
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

    // Upsert settings (insert or update)
    const { data, error } = await supabase
      .from('ai_settings')
      .upsert(
        {
          setting_key,
          config,
          updated_by: dentistId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'setting_key',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error saving AI settings:', error)
      return Response.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return Response.json({
      success: true,
      setting_key: data.setting_key,
      config: data.config,
      updated_at: data.updated_at,
    })
  } catch (error) {
    console.error('Error in POST /api/ai-settings:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
