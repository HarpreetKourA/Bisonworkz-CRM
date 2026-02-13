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

    const badgeClass = role === 'super_admin' ? styles.roleBadgeSuperAdmin
        : role === 'admin' ? styles.roleBadgeAdmin
            : styles.roleBadgeUser

    return (
        <div className={styles.container}>
            <div className={styles.profileCard}>
                <div className={styles.header}>
                    <div>
                        <h1>Profile</h1>
                        <span className={`${styles.roleBadge} ${badgeClass}`}>
                            {role.replace('_', ' ')}
                        </span>
                    </div>
                    <form action={signOut}>
                        <button className="btn btn-outline">Sign Out</button>
                    </form>
                </div>

                <div className={styles.avatarSection}>
                    <div className={styles.avatarPreview}>
                        {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
                        ) : (
                            <div className={styles.avatarInner}>
                                {fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                <form action={updateProfile} className={styles.form}>
                    <div className={styles.group}>
                        <label className={styles.label}>Role</label>
                        <input type="text" value={role.replace('_', ' ').toUpperCase()} disabled className={styles.input} />
                    </div>

                    <div className={styles.group}>
                        <label className={styles.label}>Email</label>
                        <input type="email" value={email} disabled className={styles.input} />
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
                        <p className={styles.hint}>
                            Enter a direct link to an image for your avatar.
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <a href="/" className="btn btn-outline">Cancel</a>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
