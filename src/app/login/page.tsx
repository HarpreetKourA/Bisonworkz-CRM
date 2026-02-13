import { login } from '@/app/auth/actions'
import GoogleSignInButton from '@/app/auth/GoogleSignInButton'
import styles from './page.module.css'

export default function LoginPage() {
    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.formTitle}>Welcome Back</h1>
                <p className={styles.formSubtitle}>Sign in to your Bisonworkz account</p>
                <form className={styles.form}>
                    <div className="group">
                        <label htmlFor="email" className="label">Email</label>
                        <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
                    </div>
                    <div className="group">
                        <label htmlFor="password" className="label">Password</label>
                        <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
                    </div>
                    <button formAction={login} className="btn btn-primary" style={{ width: '100%' }}>Log In</button>
                </form>

                <div className={styles.dividerRow}>
                    <div className={styles.dividerLine} />
                    <span className={styles.dividerText}>or</span>
                    <div className={styles.dividerLine} />
                </div>

                <GoogleSignInButton />
                <p className={styles.footer}>
                    Don&apos;t have an account? <a href="/signup" className={styles.link}>Sign up</a>
                </p>
            </div>
        </div>
    )
}
