import { Suspense } from 'react'
import { forgotPassword } from '@/app/auth/actions'
import AuthMessage from '@/components/AuthMessage/AuthMessage'
import styles from './page.module.css'

export default function ForgotPasswordPage() {
    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.formTitle}>Forgot Password</h1>
                <p className={styles.formSubtitle}>
                    Enter your email and we&apos;ll send you a link to reset your password
                </p>

                <Suspense>
                    <AuthMessage />
                </Suspense>

                <form className={styles.form}>
                    <div className="group">
                        <label htmlFor="email" className="label">Email</label>
                        <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
                    </div>
                    <button formAction={forgotPassword} className="btn btn-primary" style={{ width: '100%' }}>
                        Send Reset Link
                    </button>
                </form>

                <p className={styles.footer}>
                    Remember your password? <a href="/login" className={styles.link}>Back to login</a>
                </p>
            </div>
        </div>
    )
}
