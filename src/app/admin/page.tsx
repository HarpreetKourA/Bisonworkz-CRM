
'use client'

import React, { useEffect, useState } from 'react'
import AdminGuard from '@/components/Auth/AdminGuard'
import { getProfiles, updateUserRole, deleteUser, Profile } from './actions'
import { createClient } from '@/lib/supabase/client'
import styles from './Admin.module.css'
import { Trash2 } from 'lucide-react'

export default function AdminPage() {
    return (
        <AdminGuard>
            <UserManagement />
        </AdminGuard>
    )
}

function UserManagement() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [currentUserRole, setCurrentUserRole] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            // Get current user role
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: myProfile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                setCurrentUserRole(myProfile?.role || '')
            }

            const data = await getProfiles()
            setProfiles(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleRoleChange(userId: string, newRole: string) {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return

        const res = await updateUserRole(userId, newRole as any)
        if (res.error) {
            alert(res.error)
            return
        }
        loadData() // Reload to confirm
    }

    async function handleDeleteUser(userId: string, email: string) {
        if (!confirm(`Are you sure you want to delete ${email}? They will no longer be able to login.`)) return

        const res = await deleteUser(userId)
        if (res.error) {
            alert(res.error)
            return
        }
        loadData()
    }

    if (loading) return <div className="p-8">Loading users...</div>

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <h1 className={styles.title}>User Management</h1>
                    <p className={styles.subtitle}>
                        You are logged in as: <strong>{currentUserRole.replace('_', ' ')}</strong>
                    </p>
                </div>

                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead className={styles.thead}>
                            <tr>
                                <th className={styles.th}>Email</th>
                                <th className={styles.th}>Role</th>
                                <th className={styles.th}>Joined</th>
                                <th className={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tbody}>
                            {profiles.map((profile) => {
                                // Logic for disabling/hiding options
                                const isSuperAdmin = currentUserRole === 'super_admin'
                                const targetIsAdmin = profile.role === 'admin'
                                const targetIsSuperAdmin = profile.role === 'super_admin'

                                // Can edit?
                                // Super Admin can edit others (except maybe themselves depending on logic, but usually yes)
                                // Admin can edit everyone EXCEPT Super Admin and other Admins
                                const canEdit = isSuperAdmin ||
                                    (currentUserRole === 'admin' && !targetIsAdmin && !targetIsSuperAdmin)

                                return (
                                    <tr key={profile.id} className={styles.tr}>
                                        <td className={styles.td}>{profile.email}</td>
                                        <td className={styles.td}>
                                            <span className={`${styles.roleBadge} ${profile.role === 'super_admin' ? styles.roleSuperAdmin :
                                                profile.role === 'admin' ? styles.roleAdmin :
                                                    profile.role === 'manager' ? styles.roleManager :
                                                        styles.roleUser
                                                }`}>
                                                {profile.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className={styles.td}>{new Date(profile.created_at).toLocaleDateString()}</td>
                                        <td className={styles.td} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <select
                                                value={profile.role}
                                                onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                                                className={styles.select}
                                                disabled={!canEdit || profile.role === 'super_admin'} // Lock Super Admin always
                                                style={{ cursor: (!canEdit || profile.role === 'super_admin') ? 'not-allowed' : 'pointer' }}
                                            >
                                                <option value="user">User</option>
                                                <option value="manager">Manager</option>

                                                {/* Only show/enable Admin option if Super Admin */}
                                                {(isSuperAdmin || profile.role === 'admin') && (
                                                    <option value="admin">Admin</option>
                                                )}

                                                {/* Only show Super Admin option if Super Admin */}
                                                {(isSuperAdmin || profile.role === 'super_admin') && (
                                                    <option value="super_admin">Super Admin</option>
                                                )}
                                            </select>

                                            {/* Delete Button */}
                                            {canEdit && profile.role !== 'super_admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(profile.id, profile.email)}
                                                    className={styles.deleteBtn}
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} color="#ef4444" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
