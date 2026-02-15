import { Suspense } from 'react'
import { signup } from '@/app/auth/actions'
import GoogleSignInButton from '@/app/auth/GoogleSignInButton'
import PasswordInput from '@/components/PasswordInput/PasswordInput'
import AuthMessage from '@/components/AuthMessage/AuthMessage'
import styles from './page.module.css'

export default function SignupPage() {
    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.formTitle}>Create Account</h1>
                <p className={styles.formSubtitle}>Get started with Bisonworkz CRM</p>

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
                    <button formAction={signup} className="btn btn-primary" style={{ width: '100%' }}>Sign Up</button>
                </form>

                <div className={styles.dividerRow}>
                    <div className={styles.dividerLine} />
                    <span className={styles.dividerText}>or</span>
                    <div className={styles.dividerLine} />
                </div>

                <GoogleSignInButton />
                <p className={styles.footer}>
                    Already have an account? <a href="/login" className={styles.link}>Log in</a>
                </p>
            </div>
        </div>
    )
}
