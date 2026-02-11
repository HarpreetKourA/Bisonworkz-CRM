'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const fullName = formData.get('full_name') as string
    const avatarUrl = formData.get('avatar_url') as string

    const { error } = await supabase
        .from('users')
        .update({
            full_name: fullName,
            avatar_url: avatarUrl,
        })
        .eq('id', user.id)

    if (error) {
        console.error('Profile update error:', error)
        redirect('/profile?error=Could not update profile')
    }

    revalidatePath('/profile')
    revalidatePath('/', 'layout')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
