import { login } from '@/app/auth/actions'
import GoogleSignInButton from '@/app/auth/GoogleSignInButton'
import styles from './page.module.css'

export default function LoginPage() {
    return (
        <div className={styles.container}>
            <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Welcome Back</h1>
                <form className={styles.form}>
                    <div className={styles.group}>
                        <label htmlFor="email" className={styles.label}>Email</label>
                        <input id="email" name="email" type="email" required className={styles.input} />
                    </div>
                    <div className={styles.group}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input id="password" name="password" type="password" required className={styles.input} />
                    </div>
                    <button formAction={login} className="btn btn-primary" style={{ width: '100%' }}>Log In</button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
                    <span style={{ padding: '0 0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>OR</span>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
                </div>

                <GoogleSignInButton />
                <p className={styles.footer}>
                    Don't have an account? <a href="/signup" className={styles.link}>Sign up</a>
                </p>
            </div>
        </div>
    )
}
