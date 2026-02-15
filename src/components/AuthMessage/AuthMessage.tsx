'use client'

import { useSearchParams } from 'next/navigation'
import styles from './AuthMessage.module.css'

export default function AuthMessage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const success = searchParams.get('success')

    if (!error && !success) return null

    return (
        <div className={`${styles.message} ${error ? styles.error : styles.success}`}>
            <span className={styles.icon}>
                {error ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                )}
            </span>
            <span className={styles.text}>{error || success}</span>
        </div>
    )
}
