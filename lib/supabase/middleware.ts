import { NextResponse, type NextRequest } from 'next/server'

// Supabase session/auth removed. Always allow access, no session logic.
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // No authentication/session logic, always allow
  return NextResponse.next({ request })
}
