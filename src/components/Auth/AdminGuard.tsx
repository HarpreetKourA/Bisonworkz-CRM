
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [accessDenied, setAccessDenied] = useState(false)
    const [debugInfo, setDebugInfo] = useState<{ userId?: string, role?: string }>({})
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function checkAdmin() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role, deleted_at')
                .eq('id', user.id)
                .single()

            if (error || !profile || !['super_admin', 'admin'].includes(profile.role) || (profile as any).deleted_at) {
                console.warn('Access denied: User is not an admin or is deleted', error)
                setDebugInfo({ userId: user.id, role: profile?.role })
                setAccessDenied(true)
                setLoading(false)
            } else {
                setAuthorized(true)
                setLoading(false)
            }
        }

        checkAdmin()
    }, [router, supabase])

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Checking permissions...</div>
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md border border-gray-200">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">You do not have permission to view this page. This area is restricted to Administrators.</p>

                    {/* Debug Info */}
                    <div className="mb-6 p-4 bg-gray-100 rounded text-left text-sm font-mono overflow-auto">
                        <p><strong>Debug Info:</strong></p>
                        <p>User ID: {debugInfo.userId}</p>
                        <p>Role in DB: {debugInfo.role || 'null'}</p>
                        <p>Expected: super_admin / admin</p>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Return to Dashboard
                    </button>
                    <div className="mt-4 text-xs text-gray-400">
                        Top right Profile icon {'>'} Verify your role is Admin/Super Admin
                    </div>
                </div>
            </div>
        )
    }

    if (!authorized) {
        return null
    }

    return <>{children}</>
}
