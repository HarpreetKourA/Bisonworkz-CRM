import { createClient } from '@/lib/supabase/server'
import { updateProfile, signOut } from './actions'
import styles from './page.module.css'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile data (metadata)
    // Note: 'users' table usage here seems legacy or specific to this project's other parts. 
    // We mainly need 'profiles' for the role.
    const { data: userMetadata } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: roleData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const fullName = userMetadata?.full_name || user.user_metadata?.full_name || ''
    const avatarUrl = userMetadata?.avatar_url || user.user_metadata?.avatar_url || ''
    const email = user.email || ''
    const role = roleData?.role || 'user'

    return (
        <div className={styles.container}>
            <div className="card" style={{ padding: '2rem', maxWidth: '600px', width: '100%' }}>
                <div className={styles.header}>
                    <div>
                        <h1 style={{ margin: 0 }}>Profile</h1>
                        <span className={`badge ${role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`} style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '9999px',
                                marginTop: '0.5rem',
                                display: 'inline-block',
                                textTransform: 'capitalize'
                            }}>
                            {role.replace('_', ' ')}
                        </span>
                    </div>
                    <form action={signOut}>
                        <button className="btn btn-outline" style={{ fontSize: '0.875rem' }}>Sign Out</button>
                    </form>
                </div>

                <div className={styles.avatarPreview}>
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
                    ) : (
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            backgroundColor: '#e5e7eb', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', color: '#6b7280', margin: '0 auto'
                        }}>
                            {fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <form action={updateProfile} className={styles.form}>
                    <div className={styles.group}>
                        <label className={styles.label}>Role</label>
                        <input type="text" value={role.replace('_', ' ').toUpperCase()} disabled className={styles.input} style={{ opacity: 0.7, cursor: 'not-allowed', fontWeight: 'bold' }} />
                    </div>

                    <div className={styles.group}>
                        <label className={styles.label}>Email</label>
                        <input type="email" value={email} disabled className={styles.input} style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                    </div>

                    <div className={styles.group}>
                        <label htmlFor="full_name" className={styles.label}>Full Name</label>
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            defaultValue={fullName}
                            placeholder="e.g. John Doe"
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.group}>
                        <label htmlFor="avatar_url" className={styles.label}>Avatar URL</label>
                        <input
                            id="avatar_url"
                            name="avatar_url"
                            type="url"
                            defaultValue={avatarUrl}
                            placeholder="https://example.com/avatar.jpg"
                            className={styles.input}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Enter a direct link to an image for your avatar.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <a href="/" className="btn btn-outline" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>Cancel</a>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                    </div>
                </form>


            </div>
        </div>
    )
}
