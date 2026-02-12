
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = await createClient()

    // 1. Get User
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'No user logged in', details: userError }, { status: 401 })
    }

    // 2. Get Profile directly
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return NextResponse.json({
        user_id: user.id,
        email: user.email,
        profile_data: profile,
        profile_error: profileError,
        timestamp: new Date().toISOString()
    })
}
