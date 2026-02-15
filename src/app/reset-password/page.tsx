import { Suspense } from 'react'
import { resetPassword } from '@/app/auth/actions'
import PasswordInput from '@/components/PasswordInput/PasswordInput'
import AuthMessage from '@/components/AuthMessage/AuthMessage'
import styles from './page.module.css'

export default function ResetPasswordPage() {
    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.formTitle}>Reset Password</h1>
                <p className={styles.formSubtitle}>Enter your new password below</p>

                <Suspense>
                    <AuthMessage />
                </Suspense>

                <form className={styles.form}>
                    <div className="group">
                        <label htmlFor="password" className="label">New Password</label>
                        <PasswordInput id="password" name="password" />
                    </div>
                    <div className="group">
                        <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                        <PasswordInput id="confirmPassword" name="confirmPassword" />
                    </div>
                    <button formAction={resetPassword} className="btn btn-primary" style={{ width: '100%' }}>
                        Reset Password
                    </button>
                </form>

                <p className={styles.footer}>
                    <a href="/login" className={styles.link}>Back to login</a>
                </p>
            </div>
        </div>
    )
}
