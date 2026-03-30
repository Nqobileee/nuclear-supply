import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  // No real database or authentication, always return a static success response
  const body = await request.json()
  const allowedFields = [
    'timezone', 
    'date_format', 
    'theme',
    'email_notifications',
    'push_notifications',
    'in_app_notifications',
    'shipment_alerts',
    'compliance_reminders',
    'daily_digest',
    'weekly_digest'
  ]
  const profile: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const field of allowedFields) {
    if (field in body) {
      profile[field] = body[field]
    }
  }
  return NextResponse.json({ profile })
}
