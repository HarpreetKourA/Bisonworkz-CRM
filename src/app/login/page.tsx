import { Suspense } from 'react'
import { login } from '@/app/auth/actions'
import GoogleSignInButton from '@/app/auth/GoogleSignInButton'
import PasswordInput from '@/components/PasswordInput/PasswordInput'
import AuthMessage from '@/components/AuthMessage/AuthMessage'
import styles from './page.module.css'

export default function LoginPage() {
    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.formTitle}>Welcome Back</h1>
                <p className={styles.formSubtitle}>Sign in to your Bisonworkz account</p>

                <Suspense>
                    <AuthMessage />
                </Suspense>

                <form className={styles.form}>
                    <div className="group">
                        <label htmlFor="email" className="label">Email</label>
                        <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
                    </div>
                    <div className="group">
                        <label htmlFor="password" className="label">Password</label>
                        <PasswordInput />
                    </div>
                    <div className={styles.forgotRow}>
                        <a href="/forgot-password" className={styles.forgotLink}>Forgot password?</a>
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
