
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Profile = {
    id: string
    email: string
    role: 'super_admin' | 'admin' | 'manager' | 'user'
    created_at: string
}


export async function getProfiles() {
    const supabase = await createClient()

    // Check if requester is admin first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: myProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (myProfile?.role !== 'admin' && myProfile?.role !== 'super_admin') {
        throw new Error('Unauthorized')
    }

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching profiles:', error)
        return []
    }

    return profiles as Profile[]
}

export async function updateUserRole(userId: string, newRole: 'super_admin' | 'admin' | 'manager' | 'user') {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (requesterProfile?.role !== 'admin' && requesterProfile?.role !== 'super_admin') {
        return { error: 'Unauthorized' }
    }

    // --- HIERARCHY CHECKS ---
    const requesterRole = requesterProfile.role

    // 1. Fetch Target Profile to see who we are editing
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    const targetRole = targetProfile?.role

    // --- STRICT RULES ---

    // Rule 1: "Once set [Super Admin], it can't go back any other roles"
    if (targetRole === 'super_admin') {
        return { error: 'Super Admin actions are irreversible. You cannot change this role.' }
    }

    // 2. Rules
    // Only Super Admin can assign/revoke 'super_admin' or 'admin' 
    // (Actually, maybe Admin can create other Admins? The user said "Admins can only manage Managers and Users")
    // User Objective: "Super Admins can manage all roles... Admin can only manage Managers and Users."

    if (newRole === 'super_admin' || newRole === 'admin') {
        if (requesterRole !== 'super_admin') {
            return { error: 'Only Super Admins can promote to Admin/Super Admin' }
        }
    }

    // Admins cannot modify other Admins or Super Admins
    if (requesterRole === 'admin') {
        if (targetRole === 'super_admin' || targetRole === 'admin') {
            return { error: 'Admins cannot modify other Admins or Super Admins' }
        }
    }

    // Super Admin cannot degrade themselves (Safety)
    if (requesterRole === 'super_admin' && userId === user.id && newRole !== 'super_admin') {
        // Optionally allow, but warn? Let's generic block for now to prevent lockout accidental.
        // Actually, let's allow it but maybe they know what they are doing.
        // But logic says "Super Admins can manage all roles".
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        console.error('Error updating role:', error)
        return { error: 'Failed to update role' }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()

    // Verify requester
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const requesterRole = requesterProfile?.role

    if (requesterRole !== 'admin' && requesterRole !== 'super_admin') {
        return { error: 'Unauthorized' }
    }

    // Fetch Target
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    if (!targetProfile) return { error: 'User not found' }
    const targetRole = targetProfile.role

    // Logic for Deletion
    if (targetRole === 'super_admin') {
        return { error: 'Cannot delete a Super Admin.' }
    }

    // Admin can delete Users/Managers, but NOT Admins
    if (requesterRole === 'admin') {
        if (targetRole === 'admin' || targetRole === 'super_admin') {
            return { error: 'Admins cannot delete other Admins or Super Admins.' }
        }
    }

    // Perform Soft Delete
    const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId)

    if (error) {
        console.error('Error deleting user:', error)
        return { error: 'Failed to delete user' }
    }

    revalidatePath('/admin')
    return { success: true }
}

