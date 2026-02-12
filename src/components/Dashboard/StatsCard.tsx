
import React from 'react'
import { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import styles from './StatsCard.module.css'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        label: string
    }
    variant?: 'default' | 'success' | 'danger' | 'warning'
}

export default function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <span className={styles.title}>{title}</span>
                <div className={clsx(styles.iconWrapper, {
                    [styles.variantDefault]: variant === 'default',
                    [styles.variantSuccess]: variant === 'success',
                    [styles.variantDanger]: variant === 'danger',
                    [styles.variantWarning]: variant === 'warning',
                })}>
                    <Icon size={20} />
                </div>
            </div>

            <div className={styles.content}>
                <div>
                    <h3 className={styles.value}>{value}</h3>
                    {trend && (
                        <p className={clsx(styles.trend, {
                            [styles.trendPositive]: trend.value >= 0,
                            [styles.trendNegative]: trend.value < 0
                        })}>
                            {trend.value > 0 ? '+' : ''}{trend.value}%
                            <span className={styles.trendLabel}>{trend.label}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
