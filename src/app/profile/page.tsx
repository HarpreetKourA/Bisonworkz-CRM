import { createClient } from '@/lib/supabase/server'
import { updateProfile, signOut } from './actions'
import styles from './page.module.css'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile data
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fallback if profile doesn't exist yet (though trigger handles it, good for robustness)
    const fullName = profile?.full_name || user.user_metadata?.full_name || ''
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || ''
    const email = user.email || ''

    return (
        <div className={styles.container}>
            <div className="card" style={{ padding: '2rem', maxWidth: '600px', width: '100%' }}>
                <div className={styles.header}>
                    <h1 style={{ margin: 0 }}>Profile</h1>
                    <form action={signOut}>
                        <button className="btn btn-outline" style={{ fontSize: '0.875rem' }}>Sign Out</button>
                    </form>
                </div>

                <div className={styles.avatarPreview}>
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
                    ) : (
                        <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>
                            {fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                <form action={updateProfile} className={styles.form}>
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
